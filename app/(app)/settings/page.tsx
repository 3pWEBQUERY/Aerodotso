"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  Bell,
  Shield,
  Palette,
  Download,
  Trash2,
  Save,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"student" | "creator">("student");
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    updates: true,
  });
  const [theme, setTheme] = useState("system");
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement profile update API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Profil erfolgreich aktualisiert");
    } catch {
      toast.error("Fehler beim Speichern des Profils");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      // TODO: Implement data export API call
      toast.info("Datenexport wird vorbereitet...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Datenexport bereit zum Download");
    } catch {
      toast.error("Fehler beim Exportieren der Daten");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // TODO: Implement account deletion API call
      toast.success("Account wird gelöscht...");
    } catch {
      toast.error("Fehler beim Löschen des Accounts");
    }
  };

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground mt-2">
          Verwalte dein Profil und deine Einstellungen
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="space-y-6"
      >
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profil
            </CardTitle>
            <CardDescription>
              Verwalte deine persönlichen Informationen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Anzeigename</Label>
              <Input
                id="displayName"
                placeholder="Dein Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rolle</Label>
              <Select
                value={role}
                onValueChange={(value: "student" | "creator") => setRole(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wähle deine Rolle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Schüler/Student</SelectItem>
                  <SelectItem value="creator">Creator</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {role === "student"
                  ? "Optimiert für Lernunterlagen, Fächer und Prüfungsvorbereitung"
                  : "Optimiert für Ideen, Projekte und Content-Erstellung"}
              </p>
            </div>

            <Button onClick={handleSaveProfile} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Speichern..." : "Speichern"}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Benachrichtigungen
            </CardTitle>
            <CardDescription>
              Konfiguriere wie du benachrichtigt werden möchtest
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>E-Mail Benachrichtigungen</Label>
                <p className="text-sm text-muted-foreground">
                  Erhalte wichtige Updates per E-Mail
                </p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, email: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Benachrichtigungen</Label>
                <p className="text-sm text-muted-foreground">
                  Erhalte Benachrichtigungen auf deinem Gerät
                </p>
              </div>
              <Switch
                checked={notifications.push}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, push: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Produkt-Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Erfahre von neuen Features und Verbesserungen
                </p>
              </div>
              <Switch
                checked={notifications.updates}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, updates: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Erscheinungsbild
            </CardTitle>
            <CardDescription>
              Passe das Aussehen der App an
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger>
                  <SelectValue placeholder="Wähle ein Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Hell</SelectItem>
                  <SelectItem value="dark">Dunkel</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Datenschutz & Daten
            </CardTitle>
            <CardDescription>
              Verwalte deine Daten gemäß DSGVO
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Datenexport</Label>
                <p className="text-sm text-muted-foreground">
                  Lade alle deine Daten als ZIP-Datei herunter
                </p>
              </div>
              <Button variant="outline" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Exportieren
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-destructive">Account löschen</Label>
                <p className="text-sm text-muted-foreground">
                  Lösche deinen Account und alle zugehörigen Daten permanent
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Löschen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Account wirklich löschen?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Diese Aktion kann nicht rückgängig gemacht werden. Alle
                      deine Dokumente, Chats und Einstellungen werden permanent
                      gelöscht.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Ja, Account löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
