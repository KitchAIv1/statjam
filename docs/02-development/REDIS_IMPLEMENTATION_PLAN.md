# Redis Implementation Plan - Stat Tracking Queue

**Status:** 📋 Planned  
**Priority:** High  
**Estimated Time:** 1-2 days  
**Complexity:** Medium (6/10)  
**Accuracy:** High (9/10)  
**Surgical Precision:** High (8/10)

---

## 🎯 Purpose

Implement Redis as a write buffer for stat tracking to eliminate database timeout errors during fast tracking. Redis will accept all stat writes instantly (no blocking), then a background worker will process the queue and write to PostgreSQL at a controlled rate.

---

## 🔍 Problem Statement

### Current Issues

1. **Database Timeout Errors (57014)**
   - Fast tracking (10-20 stats/second) overwhelms PostgreSQL
   - Database triggers (`update_player_stats`) can't complete before next write arrives
   - Both writes and reads fail under load

2. **Write Queue Building Up**
   - `StatWriteQueueService` queues operations but still hits database directly
   - Queue size grows: `1, 2, 3, 4, 5, 6...` during fast tracking
   - Retries eventually succeed but cause delays

3. **Game Viewer Read Failures**
   - Read queries timeout during fast tracking (database busy)
   - Shows 0-0 scores temporarily
   - Eventually recovers when write load decreases

### Root Cause

**Database triggers are the bottleneck:**
- Each `game_stats` INSERT triggers multiple functions
- Triggers run synchronously (blocking)
- Under fast tracking, triggers can't complete before next write arrives
- PostgreSQL statement timeout (57014) fires

---

## ✅ Solution: Redis Write Buffer

### Architecture

```
Fast Tracking (10-20 stats/sec)
    ↓
Redis Queue (instant writes, no blocking)
    ↓
Background Worker (processes queue at controlled rate)
    ↓
PostgreSQL (batched writes, triggers run smoothly)
```

### Benefits

1. **Tracker Never Blocks** - Writes to Redis instantly (100k+ writes/second)
2. **No Timeouts** - Redis handles speed, PostgreSQL processes at its pace
3. **Better UX** - Instant feedback, no retries needed
4. **Scalable** - Handles 100+ stats/second if needed
5. **Resilient** - Redis queue survives crashes, can replay

---

## 📋 Implementation Plan

### Phase 1: Redis Queue Backend (Surgical)

**File:** `src/lib/services/statWriteQueueService.ts`

**Changes:**
- Replace in-memory array with Redis `LPUSH` (enqueue)
- Keep all existing logic (retry, error handling)
- Add Redis connection management
- Add fallback to direct PostgreSQL write if Redis unavailable

**Estimated Lines:** ~50 lines changed

**Risk:** Low - Isolated change, existing interface maintained

---

### Phase 2: Background Worker (New Service)

**File:** `src/lib/workers/redisStatWorker.ts` (new)

**Purpose:**
- Consumes Redis queue using `BRPOP` (blocking pop)
- Processes stats at controlled rate (5-10/second)
- Writes to PostgreSQL via `GameServiceV3.recordStat()`
- Handles errors and retries

**Features:**
- Atomic operations (only one worker gets message)
- Idempotency key checking (prevent duplicates)
- Error handling and retry logic
- Health checks and monitoring

**Estimated Lines:** ~200 lines new code

**Risk:** Medium - New infrastructure, needs process management

---

### Phase 3: Redis Read Cache (Optional Optimization)

**File:** `src/lib/services/gameServiceV3.ts`

**Changes:**
- Add Redis read option for Game Viewer
- Read from Redis first (instant), fallback to PostgreSQL
- Cache stats for 1-2 seconds to reduce database load

**Estimated Lines:** ~30 lines changed (optional)

**Risk:** Low - Additive change, can be disabled

---

## 🏗️ Technical Details

### Redis Data Structure

**Queue:** `stat_queue` (Redis List)
- `LPUSH stat_queue <stat_json>` - Enqueue stat
- `BRPOP stat_queue 5` - Dequeue stat (blocking, 5s timeout)

**Stat Format:**
```json
{
  "idempotencyKey": "uuid",
  "gameId": "uuid",
  "playerId": "uuid",
  "statType": "field_goal",
  "statValue": 2,
  "modifier": "made",
  "teamId": "uuid",
  "quarter": 1,
  "gameTimeMinutes": 10,
  "gameTimeSeconds": 30,
  "sequenceId": "uuid",
  "timestamp": "2025-11-25T00:00:00Z"
}
```

### Background Worker Flow

```
1. Worker starts, connects to Redis
2. Loop forever:
   a. BRPOP stat_queue (blocking, wait up to 5 seconds)
   b. If message received:
      - Parse stat JSON
      - Check idempotency key (prevent duplicates)
      - Write to PostgreSQL via GameServiceV3.recordStat()
      - Handle errors (retry or dead letter queue)
   c. If timeout (no message):
      - Continue loop (health check)
3. On shutdown: Finish current stat, then exit
```

### Error Handling

**Redis Unavailable:**
- Fallback to direct PostgreSQL write
- Log error, continue operation
- Retry Redis connection periodically

**PostgreSQL Write Failure:**
- Retry with exponential backoff (existing logic)
- After 3 retries → dead letter queue
- Alert monitoring system

**Duplicate Detection:**
- Check idempotency key before processing
- Skip if already processed
- Log duplicate attempt

---

## 🔧 Infrastructure Requirements

### Redis Hosting Options

1. **Supabase Redis** (if available)
   - Managed service
   - Same infrastructure as database
   - Easy integration

2. **Upstash Redis** (recommended)
   - Serverless Redis
   - Pay-per-use
   - Free tier available
   - Easy setup

3. **Self-Hosted Redis**
   - Docker container
   - More control
   - More maintenance

### Environment Variables

```env
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=optional_password
REDIS_QUEUE_NAME=stat_queue
REDIS_ENABLED=true
```

### Process Management

**Options:**
1. **PM2** (Node.js)
   - `pm2 start redisStatWorker.ts`
   - Auto-restart on crash
   - Logging and monitoring

2. **Docker Compose**
   - Separate container for worker
   - Easy deployment
   - Health checks

3. **Vercel Cron** (if using Vercel)
   - Serverless function
   - Runs every 5 seconds
   - No process management needed

---

## 📊 Monitoring & Observability

### Metrics to Track

1. **Queue Length**
   - Monitor `LLEN stat_queue`
   - Alert if > 100 (backlog building)

2. **Processing Rate**
   - Stats processed per second
   - Target: 5-10/second

3. **Error Rate**
   - Failed writes
   - Retry attempts
   - Dead letter queue size

4. **Latency**
   - Time from enqueue to PostgreSQL write
   - Target: < 2 seconds

### Health Checks

- Redis connection status
- Worker process status
- Queue processing rate
- Error rate

---

## 🧪 Testing Strategy

### Unit Tests

1. **Redis Queue Service**
   - Enqueue stat → verify in Redis
   - Dequeue stat → verify removed from Redis
   - Fallback to PostgreSQL if Redis unavailable

2. **Background Worker**
   - Process stat → verify PostgreSQL write
   - Handle errors → verify retry logic
   - Duplicate detection → verify idempotency

### Integration Tests

1. **Fast Tracking Simulation**
   - Write 50 stats rapidly
   - Verify all processed correctly
   - Verify no timeouts

2. **Failure Scenarios**
   - Redis down → verify fallback
   - PostgreSQL down → verify retry
   - Worker crash → verify queue persists

### Load Tests

1. **High Volume**
   - 100 stats/second for 1 minute
   - Verify queue handles load
   - Verify no data loss

2. **Sustained Load**
   - 20 stats/second for 10 minutes
   - Verify stable processing
   - Verify no memory leaks

---

## 🚀 Deployment Plan

### Step 1: Setup Redis Infrastructure

1. Choose Redis hosting (Upstash recommended)
2. Create Redis instance
3. Get connection URL
4. Add to environment variables

### Step 2: Deploy Code Changes

1. Update `statWriteQueueService.ts` (Redis backend)
2. Deploy `redisStatWorker.ts` (background worker)
3. Update environment variables
4. Deploy application

### Step 3: Start Background Worker

1. Start worker process (PM2/Docker)
2. Monitor logs for errors
3. Verify queue processing

### Step 4: Monitor & Validate

1. Test fast tracking
2. Monitor queue length
3. Verify no timeouts
4. Check error rates

### Step 5: Gradual Rollout

1. Enable Redis for 10% of games
2. Monitor performance
3. Gradually increase to 100%

---

## 📈 Success Criteria

### Performance

- ✅ No database timeout errors (57014)
- ✅ Queue length stays < 50 during fast tracking
- ✅ Stats processed within 2 seconds
- ✅ No data loss

### Reliability

- ✅ Redis fallback works (direct PostgreSQL write)
- ✅ Worker auto-restarts on crash
- ✅ Duplicate prevention works (idempotency)
- ✅ Error handling prevents data loss

### Scalability

- ✅ Handles 100+ stats/second
- ✅ Queue doesn't grow unbounded
- ✅ Worker can scale horizontally (multiple workers)

---

## 🔄 Rollback Plan

### If Redis Causes Issues

1. **Disable Redis** (environment variable)
2. **Fallback to direct PostgreSQL write** (existing code)
3. **Stop background worker**
4. **Monitor for stability**

### Code Changes Required

- Set `REDIS_ENABLED=false`
- `StatWriteQueueService` automatically falls back to direct write
- No code changes needed (fallback built-in)

---

## 📚 References

### Industry Examples

- **Twitter/X**: Redis → Kafka → Database
- **Instagram**: Redis → Celery → PostgreSQL
- **Discord**: Redis → Background workers → Database

### Redis Documentation

- [Redis Lists](https://redis.io/docs/data-types/lists/)
- [Redis Persistence](https://redis.io/docs/management/persistence/)
- [Redis Transactions](https://redis.io/docs/manual/transactions/)

---

## 🎯 Next Steps

1. ✅ Review this plan
2. ⏳ Choose Redis hosting (Upstash recommended)
3. ⏳ Implement Phase 1 (Redis queue backend)
4. ⏳ Implement Phase 2 (background worker)
5. ⏳ Test fast tracking
6. ⏳ Deploy to production
7. ⏳ Monitor performance

---

## 📝 Notes

- **Idempotency keys already exist** - No changes needed
- **Write queue pattern already exists** - Just swap backend
- **WebSocket subscriptions unchanged** - Still work correctly
- **Game Viewer reads optional** - Can be added later

**Estimated Total Development Time:** 1-2 days  
**Risk Level:** Medium (manageable)  
**Impact:** High (eliminates timeout errors)

