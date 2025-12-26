import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

export function Settings() {
  const { user } = useAuthStore()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Your account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-gray-500">Email</Label>
            <p className="font-medium">{user?.email || 'Not signed in'}</p>
          </div>
          <div>
            <Label className="text-sm text-gray-500">Display Name</Label>
            <p className="font-medium">{user?.user_metadata?.display_name || 'Not set'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Customize your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="units">Preferred Unit System</Label>
            <Select defaultValue="imperial">
              <SelectTrigger id="units">
                <SelectValue placeholder="Select unit system" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="imperial">Imperial (cups, oz, lb)</SelectItem>
                <SelectItem value="metric">Metric (ml, g, kg)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>Save Preferences</Button>
        </CardContent>
      </Card>
    </div>
  )
}
