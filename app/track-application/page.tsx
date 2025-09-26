"use client";

import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Search, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";

interface Application {
  id: string;
  status: "pending" | "in_progress" | "completed" | "rejected";
  createdTime: string;
  title: string;
  description?: string;
}

export default function TrackApplication() {
  const [applicationId, setApplicationId] = useState("");
  const [application, setApplication] = useState<Application | null>(null);
  const [isSearched, setIsSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "in_progress":
        return <Clock className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const searchApplication = () => {
    if (!applicationId.trim()) return;

    setIsLoading(true);
    setIsSearched(true);

    // Simulate API call delay
    setTimeout(() => {
      try {
        const storedApplications = localStorage.getItem("quantum_applications");
        if (storedApplications) {
          const applications: Application[] = JSON.parse(storedApplications);
          const foundApplication = applications.find(app => app.id === applicationId.trim());
          setApplication(foundApplication || null);
        } else {
          setApplication(null);
        }
      } catch (error) {
        console.error("Error reading from localStorage:", error);
        setApplication(null);
      }
      setIsLoading(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchApplication();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Track Your Application
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Enter your application ID to check the current status and details of your submission.
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8 shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-gray-900 dark:text-white">
              Find Your Application
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Enter your unique application ID below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="e.g., APP-2024-001"
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-center text-lg py-3 border-2 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={isLoading}
              />
            </div>
            <Button 
              onClick={searchApplication}
              disabled={isLoading || !applicationId.trim()}
              className="w-full py-3 text-lg"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Track Application
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {isSearched && (
          <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Search Results</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-300">Searching for your application...</p>
                </div>
              ) : application ? (
                <div className="space-y-6">
                  {/* Application Found */}
                  <div className="border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {application.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          Application ID: <span className="font-mono font-medium">{application.id}</span>
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(application.status)} flex items-center gap-1`}>
                        {getStatusIcon(application.status)}
                        {application.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {formatDate(application.createdTime)}</span>
                      </div>
                    </div>

                    {application.description && (
                      <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Description:</strong> {application.description}
                        </p>
                      </div>
                    )}

                    {/* Status Timeline */}
                    <div className="mt-6 pt-6 border-t border-green-200 dark:border-green-700">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Application Timeline</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-gray-600 dark:text-gray-300">Application submitted</span>
                          <span className="text-gray-400 dark:text-gray-500">({formatDate(application.createdTime)})</span>
                        </div>
                        {application.status !== "pending" && (
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-300">Application under review</span>
                          </div>
                        )}
                        {application.status === "completed" && (
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-300">Application completed</span>
                          </div>
                        )}
                        {application.status === "rejected" && (
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-300">Application rejected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Application Not Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    We couldn't find an application with the ID "{applicationId}".
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <p>Please check:</p>
                    <ul className="list-disc list-inside space-y-1 max-w-md mx-auto">
                      <li>The application ID is correct</li>
                      <li>The application was submitted on this device</li>
                      <li>Your browser's local storage hasn't been cleared</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        {!isSearched && (
          <Card className="mt-8 shadow-lg border-0 bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <p>• Application IDs are generated when you submit a new application</p>
              <p>• Make sure you're using the same browser and device where you submitted your application</p>
              <p>• If you can't find your application ID, try creating a new application</p>
              <p>• Contact support if you continue to experience issues</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
