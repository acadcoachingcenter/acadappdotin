import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from "@/api/apiClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Phone, Mail, UserPlus, Search, CheckCircle, Clock, XCircle, Filter, GraduationCap } from "lucide-react";
import { format } from 'date-fns';
import EnrollStudentModal from "@/components/admin/EnrollStudentModal";

const StatusBadge = ({ status }) => {
  const styles = {
    new: "bg-blue-100 text-blue-800 border-blue-300",
    contacted: "bg-yellow-100 text-yellow-800 border-yellow-300",
    enrolled: "bg-green-100 text-green-800 border-green-300",
    closed: "bg-gray-100 text-gray-800 border-gray-300",
  };
  
  const icons = {
    new: Clock,
    contacted: Phone,
    enrolled: CheckCircle,
    closed: XCircle,
  };
  
  const Icon = icons[status];
  
  return (
    <Badge className={`${styles[status]} capitalize flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {status}
    </Badge>
  );
};

export default function AdminInquiryManagement() {
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollInitialData, setEnrollInitialData] = useState(null);

  const fetchInquiries = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.entities.Inquiry.list("-inquiry_date");
      setInquiries(data);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleUpdateStatus = async (inquiryId, newStatus) => {
    try {
      await apiClient.entities.Inquiry.update(inquiryId, { status: newStatus });
      fetchInquiries(); // Refresh list
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Error updating status. Please try again.");
    }
  };

  const handleCallStudent = (phone) => {
    window.open(`tel:${phone}`);
  };

  const handleEmailStudent = (email) => {
    window.open(`mailto:${email}`);
  };

  const handleWhatsApp = (phone, studentName) => {
    const message = encodeURIComponent(`Hello! This is ACAD Coaching Center. Thank you for registering ${studentName}. I'd like to discuss the course details with you.`);
    window.open(`https://wa.me/91${phone.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  const handleEnrollClick = (inquiry) => {
    setEnrollInitialData({
      studentName: inquiry.student_name || "",
      studentEmail: inquiry.email || "",
      studentWhatsApp: inquiry.phone || "",
      remarks: inquiry.message ? `From inquiry: ${inquiry.message}` : "Enrolled by admin"
    });
    setEnrollModalOpen(true);
  };

  const filteredInquiries = useMemo(() => {
    let filtered = inquiries;

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(inq => inq.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(inq => 
        inq.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inq.parent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inq.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inq.phone?.includes(searchTerm)
      );
    }

    return filtered;
  }, [inquiries, filterStatus, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: inquiries.length,
      new: inquiries.filter(i => i.status === 'new').length,
      contacted: inquiries.filter(i => i.status === 'contacted').length,
      enrolled: inquiries.filter(i => i.status === 'enrolled').length,
      closed: inquiries.filter(i => i.status === 'closed').length,
    };
  }, [inquiries]);

  if (isLoading) {
    return <div className="p-6">Loading inquiries...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-[#1565C0]" />
          <h1 className="text-3xl font-bold text-slate-900">Inquiry Management</h1>
        </div>
        <Button onClick={fetchInquiries} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              <div className="text-sm text-slate-600">Total Inquiries</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
              <div className="text-sm text-slate-600 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                New
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.contacted}</div>
              <div className="text-sm text-slate-600 flex items-center justify-center gap-1">
                <Phone className="w-3 h-3" />
                Contacted
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.enrolled}</div>
              <div className="text-sm text-slate-600 flex items-center justify-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Enrolled
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-600">{stats.closed}</div>
              <div className="text-sm text-slate-600">Closed</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="enrolled">Enrolled</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inquiries List */}
      {filteredInquiries.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <ClipboardList className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600 text-lg">No inquiries found.</p>
            {searchTerm || filterStatus !== 'all' ? (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
              >
                Clear Filters
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredInquiries.map((inquiry) => (
            <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left: Student Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{inquiry.student_name}</h3>
                        {inquiry.parent_name && (
                          <p className="text-sm text-slate-600">Parent: {inquiry.parent_name}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          Submitted: {format(new Date(inquiry.inquiry_date), 'PPP')}
                        </p>
                      </div>
                      <StatusBadge status={inquiry.status} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700">{inquiry.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700">{inquiry.phone}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Badge variant="outline" className="mr-2">
                          {inquiry.grade_class}
                        </Badge>
                        {inquiry.subjects_interested && inquiry.subjects_interested.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {inquiry.subjects_interested.map((subject, idx) => (
                              <Badge key={idx} className="bg-blue-50 text-blue-700 text-xs">
                                {subject}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {inquiry.message && (
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-xs font-semibold text-slate-600 mb-1">Message:</p>
                        <p className="text-sm text-slate-700">{inquiry.message}</p>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="lg:w-64 space-y-3">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-600 mb-2">Quick Actions:</p>
                      
                      <Button 
                        onClick={() => handleWhatsApp(inquiry.phone, inquiry.student_name)}
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>

                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          onClick={() => handleCallStudent(inquiry.phone)}
                          variant="outline"
                          size="sm"
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                        <Button 
                          onClick={() => handleEmailStudent(inquiry.email)}
                          variant="outline"
                          size="sm"
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Email
                        </Button>
                      </div>
                    </div>

                    <div className="border-t pt-3 space-y-2">
                      <p className="text-xs font-semibold text-slate-600 mb-2">Update Status:</p>
                      
                      {inquiry.status === 'new' && (
                        <Button 
                          onClick={() => handleUpdateStatus(inquiry.id, 'contacted')}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          Mark as Contacted
                        </Button>
                      )}

                      {inquiry.status === 'contacted' && (
                        <>
                          <Button 
                            onClick={() => handleUpdateStatus(inquiry.id, 'enrolled')}
                            size="sm"
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark as Enrolled
                          </Button>
                          <Button 
                            onClick={() => handleUpdateStatus(inquiry.id, 'closed')}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            Close Inquiry
                          </Button>
                        </>
                      )}

                      {inquiry.status === 'enrolled' && (
                        <div className="text-center text-sm text-green-600 font-semibold py-2">
                          ✅ Successfully Enrolled
                        </div>
                      )}

                      {inquiry.status === 'closed' && (
                        <>
                          <Button 
                            onClick={() => handleEnrollClick(inquiry)}
                            size="sm"
                            className="w-full bg-[#1565C0] hover:bg-[#0D47A1]"
                          >
                            <GraduationCap className="w-4 h-4 mr-2" />
                            Enroll Student
                          </Button>
                          <Button 
                            onClick={() => handleUpdateStatus(inquiry.id, 'new')}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            Reopen Inquiry
                          </Button>
                        </>
                      )}
                    </div>

                    <div className="border-t pt-3">
                      <Button 
                        variant="outline"
                        size="sm"
                        className="w-full text-blue-600 border-blue-300 hover:bg-blue-50"
                        onClick={() => {
                          alert(`To invite this student:\n\n1. Go to Dashboard (sidebar)\n2. Click Data → User\n3. Click "Invite User" button\n4. Enter: ${inquiry.email}\n5. Send invitation`);
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        How to Invite?
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EnrollStudentModal
        open={enrollModalOpen}
        onOpenChange={setEnrollModalOpen}
        initialData={enrollInitialData}
        onEnrollmentSuccess={() => {
          setEnrollModalOpen(false);
          setEnrollInitialData(null);
        }}
      />
    </div>
  );
}