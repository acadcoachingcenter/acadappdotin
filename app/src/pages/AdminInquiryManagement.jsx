import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from "@/api/apiClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Phone, Mail, UserPlus, Search, CheckCircle, Clock, XCircle, Filter, GraduationCap, Trash2, Sparkles, Copy, X, Save } from "lucide-react";
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
  
  const Icon = icons[status] || Clock;
  
  return (
    <Badge className={`${styles[status] || styles.new} capitalize flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {status}
    </Badge>
  );
};

// Builds the ready-to-send WhatsApp follow-up message for a NEET | JEE
// Intense registration. Kept as plain text (not JSX) so it can go straight
// into both the clipboard-copy button and the wa.me deep link.
const buildNeetJeeWhatsAppMessage = (reg) => {
  const pathLabel =
    reg.preferred_path === 'NEET Foundation' ? 'NEET Foundation' :
    reg.preferred_path === 'JEE Foundation' ? 'JEE Foundation' :
    'NEET & JEE Foundation';

  return `Hello ${reg.parent_name || ''},\n\nThank you for registering ${reg.student_name || 'your child'} (Grade ${reg.grade || '9'}) for ACAD's NEET | JEE Intense - Grade 9 Foundation Batch.\n\nWe're excited to guide ${reg.student_name || 'them'} on the ${pathLabel} track! Our academic team will share the course structure, batch schedule and next steps shortly.\n\nFeel free to reach out anytime with questions.\n\nTeam ACAD\nacadcoachingcenter@gmail.com | +91-9790818436`;
};

export default function AdminInquiryManagement() {
  const [activeTab, setActiveTab] = useState('inquiries'); // 'inquiries' | 'neetjee'

  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollInitialData, setEnrollInitialData] = useState(null);

  const [neetJeeRegs, setNeetJeeRegs] = useState([]);
  const [isLoadingNeetJee, setIsLoadingNeetJee] = useState(true);
  const [neetJeeSearchTerm, setNeetJeeSearchTerm] = useState("");
  const [neetJeeFilterStatus, setNeetJeeFilterStatus] = useState("all");
  const [copiedId, setCopiedId] = useState(null);

  // Inline "Convert to Enrollment" mini-form - anchored to the registration
  // card it was opened from, same pattern as the "Add Course" mini-form on
  // AdminEnrollmentManagement. This is what actually creates the Enrollment
  // record: the NeetJeeIntenseRegistration row is just a lead/signup and
  // was never itself an Enrollment, so nothing (including NEET/JEE
  // Smart-Tutor eligibility, which reads the enrollments table) ever
  // activated for a registration on its own - "Mark as Enrolled" previously
  // only changed this status label, not anything real.
  const [convertRegId, setConvertRegId] = useState(null);
  const [convertForm, setConvertForm] = useState({
    course_name: 'NEET | JEE Intense',
    tutor_name: '',
    amount_paid: '',
  });
  const [isConverting, setIsConverting] = useState(false);

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

  const fetchNeetJeeRegs = async () => {
    setIsLoadingNeetJee(true);
    try {
      const data = await apiClient.entities.NeetJeeIntenseRegistration.list("-created_date");
      setNeetJeeRegs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching NEET | JEE registrations:", error);
      setNeetJeeRegs([]);
    }
    setIsLoadingNeetJee(false);
  };

  useEffect(() => {
    fetchInquiries();
    fetchNeetJeeRegs();
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

  const handleDeleteInquiry = async (inquiry) => {
    if (
      !window.confirm(
        `Delete this inquiry from ${inquiry.student_name || inquiry.email}? This only removes the inquiry record itself - if a real Enrollment was already created for them, that stays intact.`
      )
    ) {
      return;
    }

    try {
      await apiClient.entities.Inquiry.delete(inquiry.id);
      fetchInquiries();
    } catch (error) {
      console.error("Failed to delete inquiry:", error);
      alert("Error deleting inquiry. Please try again.");
    }
  };

  const handleUpdateNeetJeeStatus = async (regId, newStatus) => {
    try {
      await apiClient.entities.NeetJeeIntenseRegistration.update(regId, { status: newStatus });
      fetchNeetJeeRegs();
    } catch (error) {
      console.error("Failed to update NEET | JEE status:", error);
      alert("Error updating status. Please try again.");
    }
  };

  const handleDeleteNeetJeeReg = async (reg) => {
    if (
      !window.confirm(
        `Delete this NEET | JEE Intense registration from ${reg.student_name || reg.mobile}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await apiClient.entities.NeetJeeIntenseRegistration.delete(reg.id);
      fetchNeetJeeRegs();
    } catch (error) {
      console.error("Failed to delete NEET | JEE registration:", error);
      alert("Error deleting registration. Please try again.");
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

  const handleNeetJeeWhatsApp = (reg) => {
    const message = encodeURIComponent(buildNeetJeeWhatsAppMessage(reg));
    const phone = (reg.mobile || '').replace(/\D/g, '');
    window.open(`https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}?text=${message}`, '_blank');
  };

  const handleCopyNeetJeeMessage = async (reg) => {
    const message = buildNeetJeeWhatsAppMessage(reg);
    try {
      await navigator.clipboard.writeText(message);
      setCopiedId(reg.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      alert('Could not copy automatically - please select and copy the message manually.');
    }
  };

  const handleEnrollClick = (inquiry) => {
    setEnrollInitialData({
      inquiryId: inquiry.id,
      studentName: inquiry.student_name || "",
      studentEmail: inquiry.email || "",
      studentWhatsApp: inquiry.phone || "",
      remarks: inquiry.message ? `From inquiry: ${inquiry.message}` : "Enrolled by admin"
    });
    setEnrollModalOpen(true);
  };

  const startConvert = (reg) => {
    setConvertRegId(reg.id);
    setConvertForm({
      course_name: 'NEET | JEE Intense',
      tutor_name: '',
      amount_paid: '',
    });
  };

  const cancelConvert = () => {
    setConvertRegId(null);
    setConvertForm({ course_name: 'NEET | JEE Intense', tutor_name: '', amount_paid: '' });
  };

  const handleConvertToEnrollment = async (reg) => {
    if (!convertForm.course_name.trim()) {
      alert('Please enter a course name.');
      return;
    }

    setIsConverting(true);

    try {
      // Registrations only ever carry a WhatsApp number (mobile), never an
      // email - Enrollment records need a non-empty student_email, so a
      // WhatsApp-only contact gets the same synthetic @whatsapp.temp
      // address convention used everywhere else in enrollment creation.
      const phone = (reg.mobile || '').replace(/\D/g, '');
      const email = phone ? `${phone}@whatsapp.temp` : '';

      await apiClient.entities.Enrollment.create({
        student_name: reg.student_name || '',
        student_email: email,
        student_whatsapp: reg.mobile || '',
        course_name: convertForm.course_name.trim(),
        tutor_name: convertForm.tutor_name.trim(),
        amount_paid: parseFloat(convertForm.amount_paid) || 0,
        status: 'active',
        enrollment_date: new Date().toISOString(),
        remarks: `Converted from NEET | JEE Intense registration (${reg.preferred_path || 'Explore Both'}, Grade ${reg.grade || '9'}).`,
      });

      // Only reflect the conversion on the registration itself once the
      // real Enrollment record above has actually been created.
      await apiClient.entities.NeetJeeIntenseRegistration.update(reg.id, { status: 'enrolled' });

      cancelConvert();
      await fetchNeetJeeRegs();
      alert('Enrollment created and registration marked as enrolled.');
    } catch (error) {
      console.error('Error converting registration to enrollment:', error);
      alert('Failed to convert to enrollment: ' + error.message);
    } finally {
      setIsConverting(false);
    }
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

  const filteredNeetJeeRegs = useMemo(() => {
    let filtered = neetJeeRegs;

    if (neetJeeFilterStatus !== "all") {
      filtered = filtered.filter(reg => (reg.status || 'new') === neetJeeFilterStatus);
    }

    if (neetJeeSearchTerm) {
      const term = neetJeeSearchTerm.toLowerCase();
      filtered = filtered.filter(reg =>
        reg.student_name?.toLowerCase().includes(term) ||
        reg.parent_name?.toLowerCase().includes(term) ||
        reg.mobile?.includes(neetJeeSearchTerm)
      );
    }

    return filtered;
  }, [neetJeeRegs, neetJeeFilterStatus, neetJeeSearchTerm]);

  const stats = useMemo(() => {
    return {
      total: inquiries.length,
      new: inquiries.filter(i => i.status === 'new').length,
      contacted: inquiries.filter(i => i.status === 'contacted').length,
      enrolled: inquiries.filter(i => i.status === 'enrolled').length,
      closed: inquiries.filter(i => i.status === 'closed').length,
    };
  }, [inquiries]);

  const neetJeeStats = useMemo(() => {
    return {
      total: neetJeeRegs.length,
      new: neetJeeRegs.filter(r => (r.status || 'new') === 'new').length,
      contacted: neetJeeRegs.filter(r => r.status === 'contacted').length,
      enrolled: neetJeeRegs.filter(r => r.status === 'enrolled').length,
      closed: neetJeeRegs.filter(r => r.status === 'closed').length,
    };
  }, [neetJeeRegs]);

  if (isLoading && isLoadingNeetJee) {
    return <div className="p-6">Loading inquiries...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-[#1565C0]" />
          <h1 className="text-3xl font-bold text-slate-900">Inquiry Management</h1>
        </div>
        <Button
          onClick={() => { fetchInquiries(); fetchNeetJeeRegs(); }}
          variant="outline"
        >
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('inquiries')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'inquiries'
              ? 'border-[#1565C0] text-[#1565C0]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          General Inquiries
          {stats.new > 0 && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-300 ml-1">{stats.new} new</Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('neetjee')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'neetjee'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          NEET | JEE Intense
          {neetJeeStats.new > 0 && (
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 ml-1">{neetJeeStats.new} new</Badge>
          )}
        </button>
      </div>

      {/* =========================================================
          GENERAL INQUIRIES TAB
      ========================================================= */}
      {activeTab === 'inquiries' && (
        <>
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
                                onClick={() => handleEnrollClick(inquiry)}
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

                        <div className="border-t pt-3 space-y-2">
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

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleDeleteInquiry(inquiry)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Inquiry
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* =========================================================
          NEET | JEE INTENSE TAB
      ========================================================= */}
      {activeTab === 'neetjee' && (
        <>
          <div className="grid md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{neetJeeStats.total}</div>
                  <div className="text-sm text-slate-600">Total Registrations</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-indigo-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{neetJeeStats.new}</div>
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
                  <div className="text-2xl font-bold text-yellow-600">{neetJeeStats.contacted}</div>
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
                  <div className="text-2xl font-bold text-green-600">{neetJeeStats.enrolled}</div>
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
                  <div className="text-2xl font-bold text-slate-600">{neetJeeStats.closed}</div>
                  <div className="text-sm text-slate-600">Closed</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search by student, parent, or mobile..."
                    value={neetJeeSearchTerm}
                    onChange={(e) => setNeetJeeSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <Select value={neetJeeFilterStatus} onValueChange={setNeetJeeFilterStatus}>
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

          {filteredNeetJeeRegs.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Sparkles className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <p className="text-slate-600 text-lg">No NEET | JEE Intense registrations found.</p>
                {neetJeeSearchTerm || neetJeeFilterStatus !== 'all' ? (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setNeetJeeSearchTerm('');
                      setNeetJeeFilterStatus('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredNeetJeeRegs.map((reg) => (
                <Card key={reg.id} className="hover:shadow-md transition-shadow border-indigo-100">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{reg.student_name}</h3>
                            <p className="text-sm text-slate-600">
                              Grade {reg.grade} • Parent: {reg.parent_name}
                            </p>
                            {reg.created_date && (
                              <p className="text-xs text-slate-500 mt-1">
                                Submitted: {format(new Date(reg.created_date), 'PPP')}
                              </p>
                            )}
                          </div>
                          <StatusBadge status={reg.status || 'new'} />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-700">{reg.mobile}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
                              {reg.preferred_path || 'Explore Both'}
                            </Badge>
                          </div>
                        </div>

                        {reg.message && (
                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-slate-600 mb-1">Message:</p>
                            <p className="text-sm text-slate-700">{reg.message}</p>
                          </div>
                        )}

                        {convertRegId === reg.id && (
                          <div className="grid md:grid-cols-3 gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-700">
                                Course Name
                              </label>
                              <Input
                                value={convertForm.course_name}
                                onChange={(e) =>
                                  setConvertForm({ ...convertForm, course_name: e.target.value })
                                }
                                placeholder="NEET | JEE Intense"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-700">
                                Tutor Name
                              </label>
                              <Input
                                value={convertForm.tutor_name}
                                onChange={(e) =>
                                  setConvertForm({ ...convertForm, tutor_name: e.target.value })
                                }
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-700">
                                Fee (₹/month)
                              </label>
                              <Input
                                type="number"
                                value={convertForm.amount_paid}
                                onChange={(e) =>
                                  setConvertForm({ ...convertForm, amount_paid: e.target.value })
                                }
                              />
                            </div>
                            <div className="md:col-span-3 flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleConvertToEnrollment(reg)}
                                disabled={isConverting}
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                <Save className="w-4 h-4 mr-1" />
                                {isConverting ? "Converting..." : "Create Enrollment"}
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelConvert}>
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="lg:w-64 space-y-3">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-600 mb-2">Quick Actions:</p>

                          <Button
                            onClick={() => handleNeetJeeWhatsApp(reg)}
                            className="w-full bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Send via WhatsApp
                          </Button>

                          <Button
                            onClick={() => handleCopyNeetJeeMessage(reg)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            {copiedId === reg.id ? 'Copied!' : 'Copy Message'}
                          </Button>

                          <Button
                            onClick={() => handleCallStudent(reg.mobile)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            Call
                          </Button>
                        </div>

                        <div className="border-t pt-3 space-y-2">
                          <p className="text-xs font-semibold text-slate-600 mb-2">Update Status:</p>

                          {(reg.status || 'new') === 'new' && (
                            <Button
                              onClick={() => handleUpdateNeetJeeStatus(reg.id, 'contacted')}
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              Mark as Contacted
                            </Button>
                          )}

                          {reg.status === 'contacted' && (
                            <>
                              <Button
                                onClick={() => startConvert(reg)}
                                size="sm"
                                className="w-full bg-green-600 hover:bg-green-700"
                              >
                                <GraduationCap className="w-4 h-4 mr-2" />
                                Convert to Enrollment
                              </Button>
                              <Button
                                onClick={() => handleUpdateNeetJeeStatus(reg.id, 'closed')}
                                variant="outline"
                                size="sm"
                                className="w-full"
                              >
                                Close
                              </Button>
                            </>
                          )}

                          {reg.status === 'enrolled' && (
                            <div className="text-center text-sm text-green-600 font-semibold py-2">
                              ✅ Successfully Enrolled
                            </div>
                          )}

                          {reg.status === 'closed' && (
                            <Button
                              onClick={() => handleUpdateNeetJeeStatus(reg.id, 'new')}
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              Reopen
                            </Button>
                          )}
                        </div>

                        <div className="border-t pt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleDeleteNeetJeeReg(reg)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <EnrollStudentModal
        open={enrollModalOpen}
        onOpenChange={setEnrollModalOpen}
        initialData={enrollInitialData}
        onEnrollmentSuccess={async () => {
          if (enrollInitialData?.inquiryId) {
            await handleUpdateStatus(enrollInitialData.inquiryId, 'enrolled');
          }
          setEnrollModalOpen(false);
          setEnrollInitialData(null);
        }}
      />
    </div>
  );
}
