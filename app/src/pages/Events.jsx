import React, { useState, useEffect } from "react";
import { Event } from "@/entities/Event";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Award, BookOpen, ExternalLink, Sparkles } from "lucide-react";
import { format } from "date-fns";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const allEvents = await Event.list("-event_date");
      const publishedEvents = allEvents.filter(event => event.is_published);
      setEvents(publishedEvents);
      
      // Initialize image indexes for carousel
      const indexes = {};
      publishedEvents.forEach(event => {
        indexes[event.id] = 0;
      });
      setCurrentImageIndexes(indexes);
    } catch (error) {
      console.error("Error loading events:", error);
    }
    setIsLoading(false);
  };

  const handleNextImage = (eventId, totalImages) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [eventId]: (prev[eventId] + 1) % totalImages
    }));
  };

  const handlePrevImage = (eventId, totalImages) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [eventId]: (prev[eventId] - 1 + totalImages) % totalImages
    }));
  };

  const getCategoryColor = (category) => {
    const colors = {
      exam_results: "bg-green-100 text-green-800",
      cultural_event: "bg-purple-100 text-purple-800",
      workshop: "bg-blue-100 text-blue-800",
      achievement: "bg-yellow-100 text-yellow-800",
      other: "bg-gray-100 text-gray-800"
    };
    return colors[category] || colors.other;
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center py-12">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Award className="w-16 h-16 text-[#1565C0]" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900">ACAD Events & Achievements</h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Celebrating our students' success stories and memorable moments
        </p>
      </div>

      {/* Books Section */}
      <Card className="border-2 border-purple-200 hover:shadow-2xl transition-all duration-300">
        <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 mb-3">
              <Sparkles className="w-4 h-4 mr-1 inline" />
              Featured Publications
            </Badge>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">ACAD Proudly Presenting eBooks</h2>
            <p className="text-slate-600">Browse all available eBooks and study materials from our featured author.</p>
          </div>
          <div className="flex-shrink-0">
            <a
              href="https://skylinepixelstudio.github.io/eBooks/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg font-semibold">
                <BookOpen className="w-5 h-5 mr-2" />
                View All Books
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No events to display at the moment.</p>
            <p className="text-sm text-slate-500 mt-2">Check back soon for updates on our latest achievements!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {events.map(event => (
            <Card key={event.id} className="overflow-hidden hover:shadow-xl transition-shadow">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image Carousel */}
                {event.images && event.images.length > 0 && (
                  <div className="relative bg-slate-100 h-96 md:h-auto">
                    <img
                      src={event.images[currentImageIndexes[event.id] || 0]}
                      alt={event.title}
                      className="w-full h-full object-contain"
                    />
                    
                    {event.images.length > 1 && (
                      <>
                        <button
                          onClick={() => handlePrevImage(event.id, event.images.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => handleNextImage(event.id, event.images.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                        
                        {/* Image indicators */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {event.images.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentImageIndexes(prev => ({...prev, [event.id]: idx}))}
                              className={`w-2 h-2 rounded-full transition-all ${
                                idx === currentImageIndexes[event.id] 
                                  ? 'bg-white w-8' 
                                  : 'bg-white/50 hover:bg-white/75'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {/* Event Details */}
                <CardContent className="p-8 flex flex-col justify-center">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getCategoryColor(event.category)}>
                        {event.category.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-sm text-slate-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(event.event_date), 'MMMM d, yyyy')}
                      </span>
                    </div>
                    
                    <h2 className="text-3xl font-bold text-slate-900">{event.title}</h2>
                    
                    <p className="text-lg text-slate-700 leading-relaxed whitespace-pre-line">
                      {event.description}
                    </p>
                    
                    {event.images && event.images.length > 1 && (
                      <p className="text-sm text-slate-500">
                        📸 {event.images.length} photos • Swipe to view all
                      </p>
                    )}
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}


    </div>
  );
}