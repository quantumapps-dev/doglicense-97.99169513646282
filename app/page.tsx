"use client";

import Link from "next/link";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Plus, Search } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Quantum Apps
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Your gateway to AI-Powered Enterprise Apps
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Plus className="w-5 h-5 text-blue-600" />
                New Application
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Submit a new application for our quantum services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/new-application">
                <Button className="w-full" size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  New Application
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Search className="w-5 h-5 text-green-600" />
                Track Application
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Check the status of your submitted applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/track-application">
                <Button variant="outline" className="w-full" size="lg">
                  <Search className="w-4 h-4 mr-2" />
                  Track Application
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Status Message */}
        <div className="text-center">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardContent className="py-8">
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Generating your application.... It takes up to 5 minutes. Please refresh the browser if you don't see any updates in a few minutes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
