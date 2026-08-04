import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getUserLocation } from "@/lib/getUserLocation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import LocationMap from "@/components/hometuition/LocationMap";
import {
  GraduationCap,
  LocateFixed,
  Save,
  Loader2,
  Users,
  MapPin,
  Crown,
  ShieldCheck,
  Clock,
  AlertCircle,
  FileText,
  CheckCircle2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Checkbox } from "@/components/ui/checkbox";
import TutorTermsModal from "@/components/tutor/TutorTermsModal";

const PLAN_LIMITS = { free: 5, pro: 10, elite: Infinity };

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi",
  "Social Science", "Computer Science", "Economics", "Accountancy",
  "Business Studies", "Yoga"
];
const GRADES = [
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "Class 11", "Class 12", "Undergraduate", "Graduate"
];

const empty = {
  subjects: [],
  grades: [],
  experience_years: 0,
  teaching_mode: "Both",
  availability: "",
  address: "",
  latitude: null,
  longitude: null,
  travel_radius_km: 5,
  hourly_rate: 0,
  bio: "",
  status: "active"
};

export default function BecomeHomeTutor() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(empty);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const geocodeAddress = async (addr) => {
    if (!addr || addr.trim().length < 5) return null;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addr)}`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (e) {
      console.error("geocode error", e);
    }
    return null;
  };

  useEffect(() => {
    (async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        if (!authenticated) {
          base44.auth.redirectToLogin(window.location.pathname + window.location.search);
          return;
        }
        const u = await base44.auth.me();
        setUser(u);
        const existing = await base44.entities.HomeTutor.filter({ tutor_id: u.id });
        if (existing.length > 0) {
          const rec = existing[0];
          setProfile(rec);
          setForm({
            subjects: rec.subjects || [],
            grades: rec.grades || [],
            experience_years: rec.experience_years || 0,
            teaching_mode: rec.teaching_mode || "Both",
            availability: rec.availability || "",
            address: rec.address || "",
            latitude: rec.latitude ?? null,
            longitude: rec.longitude ?? null,
            travel_radius_km: rec.travel_radius_km ?? 5,
            hourly_rate: rec.hourly_rate || 0,
            bio: rec.bio || "",
            status: rec.status || "active"
          });
        } else {
          const urlParams = new URLSearchParams(window.location.search);
          const mode = urlParams.get("mode");
          const modeMap = { home: "In-person", online: "Online", offline: "In-person" };
          if (mode && modeMap[mode]) {
            setForm(prev => ({ ...prev, teaching_mode: modeMap[mode] }));
          }
        }
        const ints = await base44.entities.TutorInterest.filter(
          { tutor_id: u.id },
          "-created_date"
        );
        setInterests(ints);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const toggle = (key, val) => {
    setForm(prev => {
      const arr = prev[key] || [];
      return {
        ...prev,
        [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
      };
    });
  };

  const useGPS = async () => {
    setLocating(true);
    try {
      const { lat, lng } = await getUserLocation();
      update("latitude", lat);
      update("longitude", lng);
      toast({ title: "Location captured" });
    } catch (e) {
      toast({ title: "Could not get location: " + e.message, variant: "destructive" });
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({ title: "Please sign in to activate your tutor profile", variant: "destructive" });
      base44.auth.redirectToLogin(window.location.pathname + window.location.search);
      return;
    }
    if (form.subjects.length === 0 || form.grades.length === 0) {
      toast({ title: "Select at least one subject and grade", variant: "destructive" });
      return;
    }
    if (!profile && !agreedToTerms) {
      toast({ title: "Please read and agree to the ACAD Tutor Terms & Conditions before activating your profile", variant: "destructive" });
      setShowTerms(true);
      return;
    }
    let lat = form.latitude;
    let lng = form.longitude;
    if ((lat == null || lng == null) && form.address && form.address.trim()) {
      const g = await geocodeAddress(form.address);
      if (g) {
        lat = g.lat;
        lng = g.lng;
        update("latitude", lat);
        update("longitude", lng);
      }
    }
    if (lat == null || lng == null) {
      toast({ title: "Please enter your full address (with PIN code) or use GPS for location", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        tutor_id: user.id,
        tutor_name: user.full_name || user.email,
        tutor_email: user.email,
        subjects: form.subjects,
        grades: form.grades,
        experience_years: Number(form.experience_years),
        teaching_mode: form.teaching_mode,
        availability: form.availability,
        address: form.address,
        latitude: lat,
        longitude: lng,
        travel_radius_km: Number(form.travel_radius_km),
        hourly_rate: Number(form.hourly_rate),
        bio: form.bio,
        status: form.status
      };
      if (profile) {
        await base44.entities.HomeTutor.update(profile.id, payload);
      } else {
        const rec = await base44.entities.HomeTutor.create({
          ...payload,
          approval_status: "pending",
          subscription_plan: "free"
        });
        setProfile(rec);
      }
      toast({ title: "Home tutor profile saved" });
    } catch (e) {
      toast({ title: "Save failed: " + e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
          <GraduationCap className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Become a Home Tutor</h1>
          <p className="text-slate-600">
            List your home tuition services. Students within your travel radius will find you on the map.
          </p>
        </div>
      </div>

      {profile && (() => {
        const plan = profile.subscription_plan || "free";
        const limit = PLAN_LIMITS[plan];
        const activeStudents = interests.filter(i => i.status !== "closed").length;
        const remaining = limit === Infinity ? null : Math.max(0, limit - activeStudents);
        const atCap = remaining !== null && remaining <= 0;
        const approval = profile.approval_status || "pending";
        return (
          <Card className={approval === "approved" ? "bg-emerald-50 border-emerald-200" : approval === "rejected" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}>
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {approval === "approved" ? (
                    <ShieldCheck className="w-8 h-8 text-emerald-600" />
                  ) : approval === "rejected" ? (
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  ) : (
                    <Clock className="w-8 h-8 text-amber-600" />
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">
                      {approval === "approved"
                        ? "Profile Approved"
                        : approval === "rejected"
                        ? "Profile Rejected"
                        : "Pending Admin Approval"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {approval === "approved"
                        ? "Your profile is visible to students nearby."
                        : approval === "rejected"
                        ? "Please contact admin for more details."
                        : "Your profile will be visible once an admin approves it."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Plan</p>
                    <Badge className="capitalize bg-slate-900 text-white"><Crown className="w-3 h-3 mr-1" />{plan}</Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Students</p>
                    <p className="font-bold text-slate-900">
                      {activeStudents}{limit === Infinity ? "" : `/${limit}`}
                    </p>
                  </div>
                  <Link to={createPageUrl("TutorSubscription")}>
                    <Button variant="outline" size="sm">
                      <Crown className="w-4 h-4 mr-1" />Plans
                    </Button>
                  </Link>
                </div>
              </div>
              {atCap && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-amber-300 flex items-center justify-between gap-3">
                  <p className="text-sm text-amber-800">
                    You've reached the {plan} plan limit of {limit} students. Upgrade to take on more.
                  </p>
                  <Link to={createPageUrl("TutorSubscription")}>
                    <Button size="sm">Upgrade Plan</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tutor Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>Subjects You Teach *</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SUBJECTS.map(s => (
                  <Badge
                    key={s}
                    variant={form.subjects.includes(s) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggle("subjects", s)}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Classes / Grades *</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {GRADES.map(g => (
                  <Badge
                    key={g}
                    variant={form.grades.includes(g) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggle("grades", g)}
                  >
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Experience (yrs)</Label>
                <Input
                  type="number"
                  value={form.experience_years}
                  onChange={e => update("experience_years", e.target.value)}
                />
              </div>
              <div>
                <Label>Hourly Rate (₹)</Label>
                <Input
                  type="number"
                  value={form.hourly_rate}
                  onChange={e => update("hourly_rate", e.target.value)}
                />
              </div>
              <div>
                <Label>Travel Radius (km)</Label>
                <Input
                  type="number"
                  value={form.travel_radius_km}
                  onChange={e => update("travel_radius_km", e.target.value)}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Teaching Mode</Label>
                <Select value={form.teaching_mode} onValueChange={v => update("teaching_mode", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Both">Both (Online & In-person)</SelectItem>
                    <SelectItem value="In-person">In-person only</SelectItem>
                    <SelectItem value="Online">Online only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => update("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (visible to students)</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Availability</Label>
              <Input
                value={form.availability}
                onChange={e => update("availability", e.target.value)}
                placeholder="e.g., Weekdays 5-8 PM, Weekends morning"
              />
            </div>
            <div>
              <Label>Address / Locality</Label>
              <Textarea
                value={form.address}
                onChange={e => update("address", e.target.value)}
                onBlur={async (e) => {
                  const addr = e.target.value;
                  if (addr && /\d{6}/.test(addr) && form.latitude == null) {
                    const g = await geocodeAddress(addr);
                    if (g) {
                      update("latitude", g.lat);
                      update("longitude", g.lng);
                      toast({ title: "Location found from address" });
                    }
                  }
                }}
                placeholder="Full address including PIN code (used to locate you on the map automatically)"
                rows={2}
              />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea
                value={form.bio}
                onChange={e => update("bio", e.target.value)}
                placeholder="Brief intro about your teaching style..."
                rows={3}
              />
            </div>
            <div>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label>Your Location</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setGeocoding(true);
                      const g = await geocodeAddress(form.address);
                      setGeocoding(false);
                      if (g) {
                        update("latitude", g.lat);
                        update("longitude", g.lng);
                        toast({ title: "Location found from address" });
                      } else {
                        toast({ title: "Couldn't find location from address. Add PIN code or use GPS.", variant: "destructive" });
                      }
                    }}
                    disabled={geocoding || !form.address}
                  >
                    {geocoding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
                    Find from Address
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={useGPS} disabled={locating}>
                    {locating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LocateFixed className="w-4 h-4 mr-2" />}
                    Use GPS
                  </Button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {form.latitude != null
                  ? `Lat ${Number(form.latitude).toFixed(4)}, Lng ${Number(form.longitude).toFixed(4)}`
                  : "Enter your full address with PIN code above — we'll find your location automatically, or use GPS."}
              </p>
              <div className="mt-3">
                <LocationMap
                  center={form.latitude != null ? [form.latitude, form.longitude] : null}
                  radiusKm={Number(form.travel_radius_km) || 5}
                  height={260}
                />
              </div>
            </div>
            {!profile && (
              <div className="border rounded-lg p-4 bg-slate-50">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms-agree"
                    checked={agreedToTerms}
                    onCheckedChange={(v) => setAgreedToTerms(v === true)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="terms-agree" className="text-sm font-medium text-slate-900 cursor-pointer">
                      I have read and agree to the ACAD Tutor Terms &amp; Conditions
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowTerms(true)}
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> Read Full Terms &amp; Conditions
                    </button>
                    {agreedToTerms && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Terms accepted
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? "Saving..." : (profile ? "Update Profile" : (form.teaching_mode === "Online" ? "Activate Online Tutor" : form.teaching_mode === "In-person" ? "Activate Home Tutor" : "Activate Tutor"))}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" /> Interested Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            {interests.length > 0 ? (
              <div className="space-y-3">
                {interests.map((s, i) => (
                  <div key={i} className="border rounded-lg p-3">
                    <p className="font-medium">{s.student_name}</p>
                    <p className="text-xs text-slate-500">{s.student_email}</p>
                    {s.message && <p className="text-sm text-slate-600 mt-1">{s.message}</p>}
                    <p className="text-xs text-slate-400 mt-1">
                      {s.date
                        ? `Interested ${formatDistanceToNow(new Date(s.date), { addSuffix: true })}`
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">
                No interested students yet. Your profile will appear in nearby searches.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <TutorTermsModal open={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
}