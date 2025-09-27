'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Mail, 
  Calendar,
  Download,
  Play,
  Square
} from 'lucide-react';
import { format } from 'date-fns';

interface EmailLog {
  id: number;
  to: string;
  subject: string;
  timestamp: string;
  status: 'sent' | 'failed';
  error?: string;
}

interface CronStatus {
  running: boolean;
  schedule: string;
  nextRun: string | null;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [cronStatus, setCronStatus] = useState<CronStatus | null>(null);
  const [manualRecipient, setManualRecipient] = useState('hello@sarg.io');
  const [lastResult, setLastResult] = useState<any>(null);

  const fetchEmailLogs = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/reports/manualSend?limit=10');
      const data = await response.json();
      setEmailLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch email logs:', error);
    }
  };

  const fetchCronStatus = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/crons/sendReport?action=status');
      const data = await response.json();
      setCronStatus(data);
    } catch (error) {
      console.error('Failed to fetch CRON status:', error);
    }
  };

  useEffect(() => {
    fetchEmailLogs();
    fetchCronStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(() => {
      fetchCronStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleManualSend = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/reports/manualSend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: manualRecipient,
        }),
      });

      const result = await response.json();
      setLastResult(result);
      
      if (result.success) {
        // Refresh logs after successful send
        setTimeout(fetchEmailLogs, 1000);
      }
    } catch (error) {
      console.error('Failed to send manual report:', error);
      setLastResult({ success: false, error: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCronAction = async (action: 'start' | 'stop' | 'test') => {
    try {
      const url = action === 'test' 
        ? 'http://localhost:3000/api/crons/sendReport?action=test'
        : `http://localhost:3000/api/crons/sendReport?action=${action}`;
        
      const response = await fetch(url);
      const result = await response.json();
      
      if (action === 'test') {
        setLastResult(result);
        setTimeout(fetchEmailLogs, 1000);
      }
      
      // Refresh status
      fetchCronStatus();
    } catch (error) {
      console.error(`Failed to ${action} CRON job:`, error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reports & Automation</h1>
        <p className="text-muted-foreground">
          Manage automated reports and send manual reports to stakeholders.
        </p>
      </div>

      {/* CRON Job Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Automated Reporting Status
          </CardTitle>
          <CardDescription>
            Hourly reports are automatically generated and emailed to hello@sarg.io
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Label>Status:</Label>
              <Badge variant={cronStatus?.running ? 'default' : 'secondary'}>
                {cronStatus?.running ? 'Running' : 'Stopped'}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Label>Schedule:</Label>
              <span className="text-sm font-mono">{cronStatus?.schedule || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Label>Next Run:</Label>
              <span className="text-sm">
                {cronStatus?.nextRun 
                  ? format(new Date(cronStatus.nextRun), 'PPp')
                  : 'N/A'
                }
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={() => handleCronAction('start')}
              disabled={cronStatus?.running}
              size="sm"
              variant="outline"
            >
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
            <Button
              onClick={() => handleCronAction('stop')}
              disabled={!cronStatus?.running}
              size="sm"
              variant="outline"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
            <Button
              onClick={() => handleCronAction('test')}
              size="sm"
              variant="outline"
            >
              <Send className="h-4 w-4 mr-2" />
              Test Run
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Report Sending */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Send className="h-5 w-5 mr-2" />
            Send Manual Report
          </CardTitle>
          <CardDescription>
            Generate and send a report immediately to any email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 items-end mb-4">
            <div className="flex-1">
              <Label htmlFor="recipient">Recipient Email</Label>
              <Input
                id="recipient"
                type="email"
                value={manualRecipient}
                onChange={(e) => setManualRecipient(e.target.value)}
                placeholder="hello@sarg.io"
              />
            </div>
            <Button 
              onClick={handleManualSend}
              disabled={loading || !manualRecipient}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Report Now
                </>
              )}
            </Button>
          </div>

          {lastResult && (
            <div className={`p-4 rounded-lg ${lastResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center">
                {lastResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                )}
                <span className={lastResult.success ? 'text-green-800' : 'text-red-800'}>
                  {lastResult.success ? lastResult.message : `Error: ${lastResult.error || lastResult.details}`}
                </span>
              </div>
              {lastResult.success && lastResult.details && (
                <div className="mt-2 text-sm text-green-700">
                  <p>Report ID: {lastResult.details.reportId}</p>
                  <p>PDF Size: {(lastResult.details.pdfSize / 1024).toFixed(1)} KB</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Recent Email Activity
          </CardTitle>
          <CardDescription>
            History of sent reports and their delivery status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No email logs found</p>
              <p className="text-sm">Send a manual report to see activity here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emailLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {log.status === 'sent' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <div className="font-medium">{log.to}</div>
                      <div className="text-sm text-muted-foreground">{log.subject}</div>
                      {log.error && (
                        <div className="text-sm text-red-600 mt-1">{log.error}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                      {log.status}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">
                      {format(new Date(log.timestamp), 'MMM dd, HH:mm')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
