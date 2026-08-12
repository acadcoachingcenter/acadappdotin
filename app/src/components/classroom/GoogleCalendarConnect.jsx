import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/apiClient";
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function GoogleCalendarConnect() {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState("");
  const [error, setError] = useState("");

  const checkCalendarStatus = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result =
        await apiClient.auth.calendarStatus();

      setIsConnected(
        Boolean(result?.connected)
      );

      setCalendarEmail(
        result?.email || ""
      );

    } catch (error) {
      console.error(
        "Unable to check Google Calendar status:",
        error
      );

      /*
       * A 401 simply means the user is not
       * currently authenticated.
       */
      if (error?.status === 401) {
        setIsConnected(false);
      } else {
        setError(
          error?.message ||
            "Unable to check Google Calendar status."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    checkCalendarStatus();
  }, []);


  const connectCalendar = () => {
    /*
     * Return to the current Classroom page after
     * Google authorization is completed.
     */
    const returnUrl =
      window.location.href;

    apiClient.auth.connectGoogleCalendar(
      returnUrl
    );
  };


  if (isLoading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="w-5 h-5 animate-spin" />

            <span>
              Checking Google Calendar connection...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }


  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />

              <div>
                <p className="font-medium">
                  Google Calendar status unavailable
                </p>

                <p className="text-sm mt-1">
                  {error}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={checkCalendarStatus}
            >
              Retry
            </Button>

          </div>
        </CardContent>
      </Card>
    );
  }


  if (isConnected) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">

          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="rounded-full bg-green-100 p-2">
                <CheckCircle className="w-5 h-5 text-green-700" />
              </div>

              <div>
                <p className="font-semibold text-green-900">
                  Google Calendar Connected
                </p>

                {calendarEmail && (
                  <p className="text-sm text-green-700">
                    {calendarEmail}
                  </p>
                )}

                <p className="text-xs text-green-700 mt-1">
                  Classes can now be added to Google Calendar.
                </p>
              </div>

            </div>

            <Button
              type="button"
              variant="outline"
              onClick={checkCalendarStatus}
              className="border-green-300"
            >
              Refresh
            </Button>

          </div>

        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">

        <div className="flex items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="rounded-full bg-blue-100 p-2">
              <Calendar className="w-5 h-5 text-blue-700" />
            </div>

            <div>
              <p className="font-semibold text-blue-900">
                Connect Google Calendar
              </p>

              <p className="text-sm text-blue-700 mt-1">
                Connect your Google Calendar so scheduled classes
                can be added automatically.
              </p>

              <p className="text-xs text-blue-600 mt-1">
                Tutor and student notifications will use the
                scheduled class details.
              </p>
            </div>

          </div>

          <Button
            type="button"
            onClick={connectCalendar}
            className="bg-[#1565C0] hover:bg-[#1e88e5] shrink-0"
          >
            <Calendar className="w-4 h-4 mr-2" />

            Connect Calendar
          </Button>

        </div>

      </CardContent>
    </Card>
  );
}
