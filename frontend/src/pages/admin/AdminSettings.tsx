import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { 
  Store, 
  Bell, 
  Printer, 
  CreditCard, 
  Globe,
  Save
} from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure your restaurant system</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Restaurant Info */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Restaurant Information</h3>
            <p className="text-sm text-muted-foreground">Basic details about your restaurant</p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="name">Restaurant Name</Label>
            <Input id="name" defaultValue="Ama Bakery" />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" defaultValue="+91 98765 43210" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" defaultValue="123 Main Street, City Center" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="contact@amabakery.com" />
          </div>
          <div>
            <Label htmlFor="gst">GST Number</Label>
            <Input id="gst" defaultValue="22AAAAA0000A1Z5" />
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-info" />
          </div>
          <div>
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-sm text-muted-foreground">Configure alert preferences</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New Order Sound</p>
              <p className="text-sm text-muted-foreground">Play sound for new orders in kitchen</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Low Stock Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified when inventory is low</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Order Ready Notifications</p>
              <p className="text-sm text-muted-foreground">Notify waiters when order is ready</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>

      {/* Printing */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <Printer className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold">Printing</h3>
            <p className="text-sm text-muted-foreground">Configure KOT and bill printing</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-Print KOT</p>
              <p className="text-sm text-muted-foreground">Automatically print KOT when order is placed</p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Print Customer Copy</p>
              <p className="text-sm text-muted-foreground">Print customer copy of bill</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div>
            <Label htmlFor="printer">Default Printer</Label>
            <Input id="printer" placeholder="Select printer..." className="mt-2" />
          </div>
        </div>
      </Card>

      {/* Payment */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-success" />
          </div>
          <div>
            <h3 className="font-semibold">Payment Methods</h3>
            <p className="text-sm text-muted-foreground">Configure accepted payment methods</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Cash</p>
              <p className="text-sm text-muted-foreground">Accept cash payments</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">UPI</p>
              <p className="text-sm text-muted-foreground">Accept UPI payments</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Card</p>
              <p className="text-sm text-muted-foreground">Accept credit/debit card payments</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>

      {/* Regional */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Globe className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold">Regional Settings</h3>
            <p className="text-sm text-muted-foreground">Currency and language preferences</p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" defaultValue="INR (₹)" />
          </div>
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" defaultValue="Asia/Kolkata (IST)" />
          </div>
          <div>
            <Label htmlFor="dateformat">Date Format</Label>
            <Input id="dateformat" defaultValue="DD/MM/YYYY" />
          </div>
          <div>
            <Label htmlFor="timeformat">Time Format</Label>
            <Input id="timeformat" defaultValue="12-hour (AM/PM)" />
          </div>
        </div>
      </Card>
    </div>
  );
}
