import React, { useState, useEffect, useMemo } from 'react';
import { TuitionRequest } from '@/entities/TuitionRequest';
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Search, LocateFixed, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import LocationMap from "@/components/hometuition/LocationMap";
import { getUserLocation } from "@/lib/getUserLocation";
import { useToast } from "@/components/ui/use-toast";

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

export default function FindHomeTuitions() {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [origin, setOrigin] = useState(null);
  const [locating, setLocating] = useState(false);
  const [radius, setRadius] = useState(5);

  useEffect(() => {
    const fetchOpenRequests = async () => {
      try {
        const data = await TuitionRequest.filter({ status: 'open' }, "-created_date");
        setRequests(data);
      } catch (error) {
        console.error("Failed to fetch tuition requests:", error);
      }
      setIsLoading(false);
    };
    fetchOpenRequests();
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

  const filteredRequests = useMemo(() => {
    let list = requests;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(req =>
        (req.location || "").toLowerCase().includes(q) ||
        (req.subjects || []).some(s => s.toLowerCase().includes(q))
      );
    }
    if (origin) {
      list = list
        .map(r => {
          const dist =
            r.latitude != null && r.longitude != null
              ? haversine(origin.lat, origin.lng, r.latitude, r.longitude)
              : null;
          return { ...r, _dist: dist };
        })
        .filter(r => r._dist != null && r._dist <= radius)
        .sort((a, b) => a._dist - b._dist);
    }
    return list;
  }, [requests, searchTerm, origin, radius]);

  const handleShowInterest = async (req) => {
    try {
      const u = await User.me();
      const list = req.interested_tutors || [];
      if (list.includes(u.id)) {
        toast({ title: "You have already shown interest in this request" });
        return;
      }
      await TuitionRequest.update(req.id, { interested_tutors: [...list, u.id] });
      setRequests(prev =>
        prev.map(r => (r.id === req.id ? { ...r, interested_tutors: [...list, u.id] } : r))
      );
      toast({ title: "Interest sent! The parent will be notified." });
    } catch (e) {
      toast({ title: "Failed: " + e.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <MapPin className="w-8 h-8 text-[#1565C0]" />
        <h1 className="text-3xl font-bold text-slate-900">Find Home Tuitions</h1>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search by location, city, or subject..."
              className="pl-12 text-lg h-12"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex items-end">
              <Button variant="outline" onClick={useGPS} disabled={locating} className="w-full">
                {locating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LocateFixed className="w-4 h-4 mr-2" />}
                Use my location to find nearby requests
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
          {origin && (
            <LocationMap
              center={[origin.lat, origin.lng]}
              radiusKm={radius}
              markers={filteredRequests
                .filter(r => r.latitude != null && r.longitude != null)
                .map(r => ({
                  lat: r.latitude,
                  lng: r.longitude,
                  popup: `${r.subjects?.join(", ")} • ${r._dist?.toFixed(1)} km`
                }))}
              height={300}
            />
          )}
        </CardContent>
      </Card>

      {filteredRequests.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>No Open Requests</CardTitle>
            <CardDescription>
              {origin
                ? `No open home tuition requests within ${radius} km. Try increasing the radius or check back later.`
                : "There are no open home tuition requests matching your search. Check back later!"}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map(req => (
            <Card key={req.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{req.subjects.join(', ')}</CardTitle>
                <CardDescription>For {req.student_grade}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-700 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{req.location}</span>
                    {req._dist != null && (
                      <span className="text-xs text-blue-600 font-medium">• {req._dist.toFixed(1)} km away</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{req.additional_details}</p>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-4">
                    Posted {formatDistanceToNow(new Date(req.created_date), { addSuffix: true })} by {req.parent_name}
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleShowInterest(req)}
                    disabled={(req.interested_tutors || []).length > 0}
                  >
                    {(req.interested_tutors || []).length > 0 ? "Interest Shown" : "Show Interest"}
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