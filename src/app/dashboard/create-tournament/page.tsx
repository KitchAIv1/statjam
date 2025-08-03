'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Trophy, Users, Calendar, Settings, Check } from 'lucide-react';

interface TournamentData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  venue: string;
  maxTeams: number;
  tournamentType: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  isPublic: boolean;
  entryFee: number;
  prizePool: number;
}

const steps = [
  { id: 1, title: 'Basic Info', icon: <Trophy className="w-5 h-5" /> },
  { id: 2, title: 'Tournament Type', icon: <Settings className="w-5 h-5" /> },
  { id: 3, title: 'Teams & Schedule', icon: <Users className="w-5 h-5" /> },
  { id: 4, title: 'Review & Create', icon: <Check className="w-5 h-5" /> },
];

export default function CreateTournamentPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [tournamentData, setTournamentData] = useState<TournamentData>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    venue: '',
    maxTeams: 8,
    tournamentType: 'single_elimination',
    isPublic: true,
    entryFee: 0,
    prizePool: 0,
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateTournamentData = (field: keyof TournamentData, value: any) => {
    setTournamentData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    // TODO: Submit to Supabase
    console.log('Creating tournament:', tournamentData);
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 2000);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep data={tournamentData} updateData={updateTournamentData} />;
      case 2:
        return <TournamentTypeStep data={tournamentData} updateData={updateTournamentData} />;
      case 3:
        return <TeamsScheduleStep data={tournamentData} updateData={updateTournamentData} />;
      case 4:
        return <ReviewStep data={tournamentData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pt-16" style={{ backgroundColor: '#121212' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Anton, system-ui, sans-serif' }}>
            CREATE TOURNAMENT
          </h1>
          <p className="text-gray-400 text-lg">
            Set up your tournament in just a few steps
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                  currentStep >= step.id
                    ? 'border-purple-500 bg-purple-500 text-white'
                    : 'border-gray-600 text-gray-400'
                }`}>
                  {currentStep > step.id ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span className={`ml-3 font-medium ${
                  currentStep >= step.id ? 'text-white' : 'text-gray-400'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-purple-500' : 'bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-800">
            <Button
              variant="outline"
              size="lg"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep < steps.length ? (
              <Button
                variant="primary"
                size="lg"
                onClick={nextStep}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Creating Tournament...' : 'Create Tournament'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components
function BasicInfoStep({ data, updateData }: { data: TournamentData; updateData: (field: keyof TournamentData, value: any) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Tournament Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tournament Name *
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => updateData('name', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            style={{ backgroundColor: '#2a2a2a', borderColor: '#374151' }}
            placeholder="Enter tournament name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Venue *
          </label>
          <input
            type="text"
            value={data.venue}
            onChange={(e) => updateData('venue', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            style={{ backgroundColor: '#2a2a2a', borderColor: '#374151' }}
            placeholder="Enter venue name"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={data.description}
          onChange={(e) => updateData('description', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-lg border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          style={{ backgroundColor: '#2a2a2a', borderColor: '#374151' }}
          placeholder="Describe your tournament..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            value={data.startDate}
            onChange={(e) => updateData('startDate', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            style={{ backgroundColor: '#2a2a2a', borderColor: '#374151' }}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            End Date *
          </label>
          <input
            type="date"
            value={data.endDate}
            onChange={(e) => updateData('endDate', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            style={{ backgroundColor: '#2a2a2a', borderColor: '#374151' }}
            required
          />
        </div>
      </div>
    </div>
  );
}

function TournamentTypeStep({ data, updateData }: { data: TournamentData; updateData: (field: keyof TournamentData, value: any) => void }) {
  const tournamentTypes = [
    { id: 'single_elimination', name: 'Single Elimination', description: 'Teams are eliminated after one loss' },
    { id: 'double_elimination', name: 'Double Elimination', description: 'Teams must lose twice to be eliminated' },
    { id: 'round_robin', name: 'Round Robin', description: 'All teams play against each other' },
    { id: 'swiss', name: 'Swiss System', description: 'Teams play against others with similar records' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Tournament Format</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tournamentTypes.map((type) => (
          <div
            key={type.id}
            onClick={() => updateData('tournamentType', type.id)}
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              data.tournamentType === type.id
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <h3 className="text-lg font-semibold text-white mb-2">{type.name}</h3>
            <p className="text-gray-400 text-sm">{type.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Maximum Teams
          </label>
          <select
            value={data.maxTeams}
            onChange={(e) => updateData('maxTeams', parseInt(e.target.value))}
            className="w-full px-4 py-3 rounded-lg border text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            style={{ backgroundColor: '#2a2a2a', borderColor: '#374151' }}
          >
            {[4, 8, 16, 32, 64].map(num => (
              <option key={num} value={num}>{num} Teams</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tournament Visibility
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={data.isPublic}
                onChange={() => updateData('isPublic', true)}
                className="mr-2"
              />
              <span className="text-white">Public</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={!data.isPublic}
                onChange={() => updateData('isPublic', false)}
                className="mr-2"
              />
              <span className="text-white">Private</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamsScheduleStep({ data, updateData }: { data: TournamentData; updateData: (field: keyof TournamentData, value: any) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Teams & Scheduling</h2>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Tournament Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Format:</span>
            <p className="text-white font-medium">{data.tournamentType.replace('_', ' ').toUpperCase()}</p>
          </div>
          <div>
            <span className="text-gray-400">Teams:</span>
            <p className="text-white font-medium">{data.maxTeams}</p>
          </div>
          <div>
            <span className="text-gray-400">Duration:</span>
            <p className="text-white font-medium">
              {data.startDate && data.endDate 
                ? `${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}`
                : 'Not set'
              }
            </p>
          </div>
          <div>
            <span className="text-gray-400">Visibility:</span>
            <p className="text-white font-medium">{data.isPublic ? 'Public' : 'Private'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Entry Fee ($)
          </label>
          <input
            type="number"
            value={data.entryFee}
            onChange={(e) => updateData('entryFee', parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 rounded-lg border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            style={{ backgroundColor: '#2a2a2a', borderColor: '#374151' }}
            placeholder="0"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Prize Pool ($)
          </label>
          <input
            type="number"
            value={data.prizePool}
            onChange={(e) => updateData('prizePool', parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 rounded-lg border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            style={{ backgroundColor: '#2a2a2a', borderColor: '#374151' }}
            placeholder="0"
            min="0"
          />
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-blue-400 text-sm">
          💡 <strong>Tip:</strong> Teams can be added after tournament creation. You can also import teams from CSV or invite players directly.
        </p>
      </div>
    </div>
  );
}

function ReviewStep({ data }: { data: TournamentData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Review & Create</h2>
      
      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Tournament Details</h3>
            <div className="space-y-3">
              <div>
                <span className="text-gray-400">Name:</span>
                <p className="text-white font-medium">{data.name}</p>
              </div>
              <div>
                <span className="text-gray-400">Venue:</span>
                <p className="text-white font-medium">{data.venue}</p>
              </div>
              <div>
                <span className="text-gray-400">Description:</span>
                <p className="text-white">{data.description || 'No description provided'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Tournament Settings</h3>
            <div className="space-y-3">
              <div>
                <span className="text-gray-400">Format:</span>
                <p className="text-white font-medium">{data.tournamentType.replace('_', ' ').toUpperCase()}</p>
              </div>
              <div>
                <span className="text-gray-400">Max Teams:</span>
                <p className="text-white font-medium">{data.maxTeams}</p>
              </div>
              <div>
                <span className="text-gray-400">Visibility:</span>
                <p className="text-white font-medium">{data.isPublic ? 'Public' : 'Private'}</p>
              </div>
              <div>
                <span className="text-gray-400">Entry Fee:</span>
                <p className="text-white font-medium">${data.entryFee}</p>
              </div>
              <div>
                <span className="text-gray-400">Prize Pool:</span>
                <p className="text-white font-medium">${data.prizePool}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <div>
            <span className="text-gray-400">Date Range:</span>
            <p className="text-white font-medium">
              {data.startDate && data.endDate 
                ? `${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}`
                : 'Not set'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <p className="text-green-400 text-sm">
          ✅ <strong>Ready to create!</strong> Your tournament will be set up and ready for team registration.
        </p>
      </div>
    </div>
  );
} 