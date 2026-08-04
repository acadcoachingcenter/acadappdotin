import React, { useState, useEffect, useRef } from "react";
import { Event } from "@/entities/Event";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Image as ImageIcon, PlusCircle, Trash2, Eye, EyeOff, Save, X } from "lucide-react";
import { format } from "date-fns";

export default function AdminEventManagement() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    category: "achievement",
    images: [],
    is_published: false
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const allEvents = await Event.list("-created_date");
      setEvents(allEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    }
    setIsLoading(false);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadPromises = files.map((file) => UploadFile({ file }));
      const results = await Promise.all(uploadPromises);
      const imageUrls = results.map((result) => result.file_url);

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...imageUrls]
      }));
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload some images. Please try again.");
    }
    setUploadingImages(false);
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSaveEvent = async () => {
    if (!formData.title || !formData.description || !formData.event_date) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      if (editingEvent) {
        await Event.update(editingEvent.id, formData);
      } else {
        await Event.create(formData);
      }

      setFormData({
        title: "",
        description: "",
        event_date: "",
        category: "achievement",
        images: [],
        is_published: false
      });
      setEditingEvent(null);
      setIsCreatingNew(false);
      loadEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Failed to save event. Please try again.");
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      event_date: event.event_date,
      category: event.category,
      images: event.images || [],
      is_published: event.is_published
    });
    setIsCreatingNew(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      await Event.delete(eventId);
      loadEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event.");
    }
  };

  const handleTogglePublish = async (event) => {
    try {
      await Event.update(event.id, { is_published: !event.is_published });
      loadEvents();
    } catch (error) {
      console.error("Error toggling publish status:", error);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-slate-200 text-3xl font-bold">Event Management</h1>
        <Button onClick={() => setIsCreatingNew(true)} className="bg-[#1565C0] hover:bg-[#1e88e5]">
          <PlusCircle className="w-4 h-4 mr-2" />
          Create New Event
        </Button>
      </div>

      {/* Event Creation/Edit Form */}
      {isCreatingNew &&
      <Card className="border-2 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editingEvent ? "Edit Event" : "Create New Event"}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => {
              setIsCreatingNew(false);
              setEditingEvent(null);
              setFormData({
                title: "",
                description: "",
                event_date: "",
                category: "achievement",
                images: [],
                is_published: false
              });
            }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Title *</Label>
                <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Hindi Prachar Sabha Exam Results - August 2025" />

              </div>
              
              <div className="space-y-2">
                <Label>Event Date *</Label>
                <Input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} />

              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exam_results">Exam Results</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                  <SelectItem value="cultural_event">Cultural Event</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the event, achievements, and details..."
              className="h-32" />

            </div>

            <div className="space-y-2">
              <Label>Event Photos</Label>
              <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              className="hidden" />

              <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImages}
              className="w-full">

                <ImageIcon className="w-4 h-4 mr-2" />
                {uploadingImages ? "Uploading..." : "Upload Photos"}
              </Button>
              
              {formData.images.length > 0 &&
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-4">
                  {formData.images.map((imageUrl, index) =>
              <div key={index} className="relative group">
                      <img
                  src={imageUrl}
                  alt={`Event ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg" />

                      <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">

                        <X className="w-3 h-3" />
                      </button>
                    </div>
              )}
                </div>
            }
            </div>

            <div className="flex items-center gap-2">
              <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              className="w-4 h-4" />

              <Label htmlFor="is_published">Publish event (make visible to public)</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
              setIsCreatingNew(false);
              setEditingEvent(null);
            }}>
                Cancel
              </Button>
              <Button onClick={handleSaveEvent} className="bg-[#1565C0] hover:bg-[#1e88e5]">
                <Save className="w-4 h-4 mr-2" />
                {editingEvent ? "Update Event" : "Create Event"}
              </Button>
            </div>
          </CardContent>
        </Card>
      }

      {/* Events List */}
      <Card>
        <CardHeader className="bg-sky-600 p-6 flex flex-col space-y-1.5">
          <CardTitle>All Events ({events.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ?
          <div className="text-center py-8">Loading events...</div> :
          events.length === 0 ?
          <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No events created yet.</p>
            </div> :

          <div className="space-y-4">
              {events.map((event) =>
            <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          <Badge className={getCategoryColor(event.category)}>
                            {event.category.replace('_', ' ')}
                          </Badge>
                          {event.is_published ?
                      <Badge className="bg-green-100 text-green-800">
                              <Eye className="w-3 h-3 mr-1" />
                              Published
                            </Badge> :

                      <Badge className="bg-gray-100 text-gray-800">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Draft
                            </Badge>
                      }
                        </div>
                        
                        <p className="text-sm text-slate-600 mb-2">{event.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(event.event_date), 'PPP')}
                          </span>
                          {event.images && event.images.length > 0 &&
                      <span className="flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              {event.images.length} photos
                            </span>
                      }
                        </div>
                        
                        {event.images && event.images.length > 0 &&
                    <div className="flex gap-1 mt-2">
                            {event.images.slice(0, 4).map((img, idx) =>
                      <img
                        key={idx}
                        src={img}
                        alt={`Preview ${idx + 1}`}
                        className="w-16 h-16 object-cover rounded" />

                      )}
                            {event.images.length > 4 &&
                      <div className="w-16 h-16 bg-slate-200 rounded flex items-center justify-center text-xs text-slate-600">
                                +{event.images.length - 4}
                              </div>
                      }
                          </div>
                    }
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePublish(event)}>

                          {event.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditEvent(event)}>

                          Edit
                        </Button>
                        <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteEvent(event.id)}>

                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            )}
            </div>
          }
        </CardContent>
      </Card>
    </div>);

}