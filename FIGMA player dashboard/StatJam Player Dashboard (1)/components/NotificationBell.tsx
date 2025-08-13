import { useState } from 'react';
import { Bell, Calendar, Trophy, Users, Clock, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface Notification {
  id: string;
  type: 'tournament' | 'achievement' | 'reminder' | 'social';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'tournament',
    title: 'Upcoming Tournament',
    message: 'Eagles match starts in 2 hours 15 minutes',
    time: '2 hours',
    isRead: false,
    icon: <Calendar className="w-4 h-4" />,
    priority: 'high'
  },
  {
    id: '2',
    type: 'tournament',
    title: 'Tournament Reminder',
    message: 'Wildcats game tomorrow at 7:30 PM - Don\'t forget!',
    time: '1 day',
    isRead: false,
    icon: <Clock className="w-4 h-4" />,
    priority: 'medium'
  },
  {
    id: '3',
    type: 'achievement',
    title: 'New Achievement',
    message: 'You unlocked "Double-Double Master" badge!',
    time: '3 hours',
    isRead: true,
    icon: <Trophy className="w-4 h-4" />,
    priority: 'medium'
  },
  {
    id: '4',
    type: 'social',
    title: 'Video Highlight',
    message: 'Your dunk video reached 1K views!',
    time: '5 hours',
    isRead: true,
    icon: <Users className="w-4 h-4" />,
    priority: 'low'
  },
  {
    id: '5',
    type: 'reminder',
    title: 'Training Session',
    message: 'Weekly training session starts in 30 minutes',
    time: '30 min',
    isRead: false,
    icon: <Clock className="w-4 h-4" />,
    priority: 'high'
  }
];

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getPriorityColor = (priority: string, isRead: boolean) => {
    if (isRead) return 'text-muted-foreground';
    
    switch (priority) {
      case 'high':
        return 'text-primary';
      case 'medium':
        return 'text-chart-1';
      default:
        return 'text-chart-2';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tournament':
        return <Calendar className="w-4 h-4" />;
      case 'achievement':
        return <Trophy className="w-4 h-4" />;
      case 'social':
        return <Users className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative glass-card hover:glass-card-light border-border/50 transition-all duration-200"
        >
          <Bell className="w-5 h-5 text-foreground" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center bg-primary text-primary-foreground border-2 border-background"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0 glass-modal border-2 border-primary/20 shadow-2xl" 
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="glass-modal-header p-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Notifications</h3>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`relative p-4 hover:bg-accent/50 transition-colors cursor-pointer group ${
                    !notification.isRead ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 mt-1 ${getPriorityColor(notification.priority, notification.isRead)}`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-medium text-sm ${
                            !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {notification.title}
                          </p>
                          <p className={`text-sm mt-1 ${
                            !notification.isRead ? 'text-foreground/80' : 'text-muted-foreground'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {notification.time} ago
                          </p>
                        </div>
                        
                        {/* Unread indicator */}
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-border/30 glass-modal-header">
            <Button 
              variant="ghost" 
              className="w-full text-sm text-primary hover:text-primary/80 hover:bg-primary/10"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}