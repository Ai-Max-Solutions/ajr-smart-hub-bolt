
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Camera, 
  Phone, 
  Mail, 
  Shield, 
  Award, 
  Clock,
  Briefcase,
  CheckCircle,
  AlertTriangle,
  Plus
} from 'lucide-react';

export default function MyProfile() {
  return (
    <div className="min-h-screen bg-aj-navy-deep text-white font-sans p-6">
      <div className="max-w-7xl mx-auto grid gap-6 lg:grid-cols-3 md:grid-cols-2 grid-cols-1">

        {/* Header */}
        <div className="lg:col-span-3 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Good evening, Mark!</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-aj-yellow text-aj-navy-deep">
                Operative
              </Badge>
              <span className="text-aj-blue-calm">•</span>
              <span className="text-sm text-aj-blue-calm">Active</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-12 h-12 border-2 border-aj-yellow">
                <AvatarImage src="/avatar.jpg" />
                <AvatarFallback className="bg-aj-yellow text-aj-navy-deep">MC</AvatarFallback>
              </Avatar>
            </div>
            <Button className="bg-aj-yellow text-aj-navy-deep hover:bg-aj-yellow-bright font-medium">
              <Camera className="h-4 w-4 mr-2" />
              Capture Selfie
            </Button>
          </div>
        </div>

        {/* Profile Completion */}
        <Card className="bg-aj-navy-light/50 border-aj-blue-calm/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-white mb-2">Profile Complete</h2>
            <div className="text-4xl font-bold text-aj-yellow mb-2">86%</div>
            <p className="text-xs text-aj-blue-calm">Well done!</p>
          </CardContent>
        </Card>

        {/* Personal Details */}
        <Card className="bg-aj-navy-light/50 border-aj-blue-calm/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-white">Mark Croud</p>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-aj-blue-calm" />
              <span className="text-aj-blue-calm">croudmark@gmail.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-aj-blue-calm" />
              <span className="text-aj-blue-calm">07944505151</span>
            </div>
            <Button variant="outline" size="sm" className="mt-3 border-aj-yellow text-aj-yellow hover:bg-aj-yellow hover:text-aj-navy-deep">
              Edit Details
            </Button>
          </CardContent>
        </Card>

        {/* CSCS Card */}
        <Card className="bg-aj-navy-light/50 border-aj-blue-calm/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <Award className="h-5 w-5 text-aj-yellow" />
              CSCS Card
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-aj-blue-calm">Status:</span>
              <Badge className="bg-success text-success-foreground">Valid</Badge>
            </div>
            <p className="text-aj-blue-calm">Card Type: <span className="text-white">Labourer</span></p>
            <p className="text-aj-blue-calm">Expires: <span className="text-white">Jul 17, 2027</span></p>
            <Button variant="outline" size="sm" className="border-aj-yellow text-aj-yellow hover:bg-aj-yellow hover:text-aj-navy-deep">
              View Details
            </Button>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="bg-aj-navy-light/50 border-aj-blue-calm/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <Shield className="h-5 w-5 text-aj-yellow" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-white font-medium">Carrie Croud (Spouse)</p>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-aj-blue-calm" />
              <span className="text-aj-blue-calm">07801061821</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 bg-aj-navy-light/50 border-aj-blue-calm/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <Clock className="h-5 w-5 text-aj-yellow" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-aj-navy-deep/30">
                <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">Timesheet Submitted</p>
                  <p className="text-aj-blue-calm text-xs">Jul 17, 6:21 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-aj-navy-deep/30">
                <Shield className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">RAMS Document Signed</p>
                  <p className="text-aj-blue-calm text-xs">Jul 16, 6:21 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-aj-navy-deep/30">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">CSCS Card Expiry Reminder</p>
                  <p className="text-aj-blue-calm text-xs">Jul 15, 6:21 PM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Types */}
        <Card className="bg-aj-navy-light/50 border-aj-blue-calm/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <Briefcase className="h-5 w-5 text-aj-yellow" />
              Work Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <Briefcase className="h-8 w-8 mx-auto text-aj-blue-calm mb-2" />
              <p className="text-aj-blue-calm mb-3">No work types assigned</p>
              <Button variant="outline" size="sm" className="border-aj-yellow text-aj-yellow hover:bg-aj-yellow hover:text-aj-navy-deep">
                <Plus className="h-4 w-4 mr-2" />
                Add Work Types
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Safety Checklist */}
        <Card className="lg:col-span-3 bg-aj-navy-light/50 border-aj-blue-calm/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <CheckCircle className="h-5 w-5 text-aj-yellow" />
              Daily Safety Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-aj-navy-deep/30">
                <input type="checkbox" disabled className="rounded border-aj-blue-calm" />
                <span className="text-aj-blue-calm">Hard hat worn and in good condition</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-aj-navy-deep/30">
                <input type="checkbox" disabled className="rounded border-aj-blue-calm" />
                <span className="text-aj-blue-calm">Safety boots in good condition</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-aj-navy-deep/30">
                <input type="checkbox" disabled className="rounded border-aj-blue-calm" />
                <span className="text-aj-blue-calm">Hi-vis worn properly</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-aj-navy-deep/30">
                <input type="checkbox" disabled className="rounded border-aj-blue-calm" />
                <span className="text-aj-blue-calm">Gloves worn as required</span>
              </div>
            </div>
            <p className="text-sm text-aj-blue-calm mt-4">0/4 required completed</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
