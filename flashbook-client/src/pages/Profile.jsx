import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { User, Mail, Shield, LogOut, CheckCircle2, Edit2 } from 'lucide-react';
import api from '../api/axios';

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await api.put('/users/me', { fullName });
      updateUser(response.data);
      setSuccess(true);
      setIsEditing(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card className="shadow-xl border-zinc-200">
        <CardHeader className="text-center space-y-2">
          <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-black mx-auto mb-2 shadow-md">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <CardTitle className="text-2xl font-extrabold">{user?.fullName || 'User Account'}</CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Profile updated successfully!</span>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-800 text-sm">
              {error}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-3 p-4 border border-zinc-200 rounded-2xl">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="w-1/2" onClick={() => setIsEditing(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" variant="accent" size="sm" className="w-1/2" disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center text-muted-foreground">
                  <User className="h-4 w-4 mr-2 text-accent" /> Full Name
                </span>
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  {user?.fullName}
                  <button onClick={() => setIsEditing(true)} className="text-muted-foreground hover:text-accent">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-200/60 pt-3">
                <span className="flex items-center text-muted-foreground">
                  <Mail className="h-4 w-4 mr-2 text-accent" /> Email
                </span>
                <span className="font-semibold text-foreground">{user?.email}</span>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-200/60 pt-3">
                <span className="flex items-center text-muted-foreground">
                  <Shield className="h-4 w-4 mr-2 text-accent" /> Assigned Role
                </span>
                <Badge variant="accent">{user?.role || 'USER'}</Badge>
              </div>
            </div>
          )}

          <Button variant="outline" className="w-full text-destructive border-zinc-200" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
