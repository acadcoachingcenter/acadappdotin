import React, { useState, useEffect, useMemo } from "react";
import { apiClient } from "@/api/apiClient";
import { getUserLocation } from "@/lib/getUserLocation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  LocateFixed,
  Loader2,
  MapPin,
  Star,
  GraduationCap,
  Clock,
  IndianRupee,
  MessageSquare
} from "lucide-react";

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function FindTeachersNearYou() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [origin, setOrigin] = useState(null);
  const [address, setAddress] = useState("");
  const [radius, setRadius] = useState(5);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [contactingId, setContactingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const u = await apiClient.auth.me();
        setUser(u);
      } catch (e) {
        /* anonymous browsing allowed */
      }
      try {
        const data = await apiClient.entities.HomeTutor.filter({ status: "active" });
        setTutors(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const useGPS = async () => {
    setLocating(true);
    try {
      const { lat, lng } = await getUserLocation();
      setOrigin({ lat, lng });
      toast({ title: "Location found" });
    } catch (e) {
      toast({ title: "Location error: " + e.message, variant: "destructive" });
    } finally {
      setLocating(false);
    }
  };

  const geocodeAddress = async () => {
    if (!address.trim()) return;
    setLocating(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
      );
      const data = await res.json();
      if (data && data[0]) {
        setOrigin({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        toast({ title: "Location found" });
      } else {
        toast({ title: "Address not found. Try GPS.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Could not geocode address", variant: "destructive" });
    } finally {
      setLocating(false);
    }
  };

  const matches = useMemo(() => {
    if (!origin) return [];
    return tutors
      .filter(t => t.approval_status !== "pending" && t.approval_status !== "rejected")
      .filter(t => t.latitude != null && t.longitude != null)
      .map(t => {
        const dist = haversine(origin.lat, origin.lng, t.latitude, t.longitude);
        return { ...t, _dist: dist, _inTutorRadius: dist <= (t.travel_radius_km ?? 5) };
      })
      .filter(t => t._dist <= radius && t._inTutorRadius)
      .filter(t => subjectFilter === "all" || (t.subjects || []).includes(subjectFilter))
      .sort((a, b) => a._dist - b._dist);
  }, [tutors, origin, radius, subjectFilter]);

  const allSubjects = useMemo(() => {
    const s = new Set();
    tutors.forEach(t => (t.subjects || []).forEach(x => s.add(x)));
    return [...s].sort();
  }, [tutors]);

  const handleContact = async (tutor) => {
    if (!user) {
      toast({ title: "Please log in to contact a tutor" });
      try {
        apiClient.auth.redirectToLogin(window.location.pathname);
      } catch (_) {}
      return;
    }
    setContactingId(tutor.id);
    try {
      const existing = await apiClient.entities.TutorInterest.filter({
        tutor_id: tutor.id,
        student_id: user.id
      });
      if (existing.length > 0) {
        toast({ title: "You have already contacted this tutor" });
        return;
      }
      await apiClient.entities.TutorInterest.create({
        tutor_id: tutor.id,
        tutor_name: tutor.tutor_name,
        student_id: user.id,
        student_name: user.full_name || user.email,
        student_email: user.email,
        status: "pending",
        date: new Date().toISOString()
      });
      toast({ title: "Interest sent! The tutor will contact you soon." });
    } catch (e) {
      toast({ title: "Failed: " + e.message, variant: "destructive" });
    } finally {
      setContactingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <MapPin className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Find Teachers Near You</h1>
          <p className="text-slate-600">
            Discover qualified home tutors within your area, matched by proximity.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <Label>Search by address</Label>
              <div className="flex gap-2">
                <Input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Enter your area / city"
                />
                <Button onClick={geocodeAddress} disabled={locating}>Search</Button>
              </div>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={useGPS} disabled={locating} className="w-full">
                {locating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LocateFixed className="w-4 h-4 mr-2" />}
                Use my GPS location
              </Button>
            </div>
            <div>
              <Label>Search radius: {radius} km</Label>
              <input
                type="range"
                min={1}
                max={50}
                value={radius}
                onChange={e => setRadius(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          {allSubjects.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="whitespace-nowrap">Subject:</Label>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {allSubjects.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {subjectFilter !== "all" && (
                <Button variant="ghost" size="sm" onClick={() => setSubjectFilter("all")}>Clear</Button>
              )}
            </div>
          )}
          {origin && (
            <LocationMap
              center={[origin.lat, origin.lng]}
              radiusKm={radius}
              markers={matches.map(t => ({
                lat: t.latitude,
                lng: t.longitude,
                popup: `${t.tutor_name} • ${t._dist.toFixed(1)} km`
              }))}
              height={320}
            />
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : !origin ? (
        <Card>
          <CardContent className="p-10 text-center text-slate-500">
            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>Use GPS or enter your address to find nearby tutors.</p>
          </CardContent>
        </Card>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-slate-500">
            <p>No tutors found within {radius} km. Try increasing the radius.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map(t => (
            <Card key={t.id} className="flex flex-col">
              <CardContent className="p-4 flex-grow flex flex-col">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-lg">{t.tutor_name}</p>
                    <p className="text-sm text-blue-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{t._dist.toFixed(1)} km away
                    </p>
                  </div>
                  {t.rating > 0 && (
                    <Badge className="flex items-center gap-1">
                      <Star className="w-3 h-3" />{Number(t.rating).toFixed(1)}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(t.subjects || []).map(s => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
                <div className="text-sm text-slate-600 mt-2 space-y-1">
                  <p className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />{(t.grades || []).join(", ")}
                  </p>
                  <p className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />{t.availability || "—"}
                  </p>
                  {t.hourly_rate > 0 && (
                    <p className="flex items-center gap-1">
                      <IndianRupee className="w-3 h-3" />{t.hourly_rate}/hr
                    </p>
                  )}
                  <p>Experience: {t.experience_years || 0} yrs</p>
                  <p>Mode: {t.teaching_mode}</p>
                </div>
                {t.bio && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{t.bio}</p>}
                <div className="mt-3 pt-3 border-t">
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleContact(t)}
                    disabled={contactingId === t.id}
                  >
                    {contactingId === t.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <MessageSquare className="w-4 h-4 mr-2" />
                    )}
                    Contact Tutor
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}