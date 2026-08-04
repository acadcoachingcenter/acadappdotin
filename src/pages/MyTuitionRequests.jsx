import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { TuitionRequest } from '@/entities/TuitionRequest';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";
import { format } from 'date-fns';

const StatusBadge = ({ status }) => {
  const styles = {
    open: "bg-green-100 text-green-800",
    in_progress: "bg-blue-100 text-blue-800",
    closed: "bg-gray-100 text-gray-800",
  };
  return <Badge className={`${styles[status]} capitalize`}>{status.replace('_', ' ')}</Badge>;
};

export default function MyTuitionRequests() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const user = await User.me();
        const data = await TuitionRequest.filter({ parent_id: user.id }, "-created_date");
        setRequests(data);
      } catch (error) {
        console.error("Failed to fetch tuition requests:", error);
      }
      setIsLoading(false);
    };
    fetchRequests();
  }, []);

  const handleCloseRequest = async (requestId) => {
    if (!confirm("Are you sure you want to close this request? Tutors will no longer see it.")) return;
    
    try {
      await TuitionRequest.update(requestId, { status: 'closed' });
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'closed' } : r));
    } catch (error) {
      alert("Failed to close request. Please try again.");
    }
  };

  if (isLoading) {
    return <div>Loading your requests...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <ClipboardList className="w-8 h-8 text-[#1565C0]" />
        <h1 className="text-3xl font-bold text-slate-900">My Home Tuition Requests</h1>
      </div>
      
      {requests.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>No Requests Found</CardTitle>
            <CardDescription>You have not posted any home tuition requests yet.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <Card key={req.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="mb-1">{req.subjects.join(', ')} for {req.student_grade}</CardTitle>
                    <CardDescription>Posted on {format(new Date(req.created_date), 'PPP')} in {req.location}</CardDescription>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-4">{req.additional_details}</p>
                 {req.status === 'open' && (
                  <div className="flex justify-end">
                    <Button variant="destructive" size="sm" onClick={() => handleCloseRequest(req.id)}>
                      Close Request
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}