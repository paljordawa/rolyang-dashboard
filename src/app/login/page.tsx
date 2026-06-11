import { login } from './actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default async function LoginPage(props: { searchParams: Promise<{ message?: string }> }) {
  const searchParams = await props.searchParams;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md z-10 relative">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="mb-6">
            <img src="/rolyang-logo.svg" alt="Rolyang Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Admin Portal</h1>
          <p className="text-zinc-400 text-sm">Sign in to manage the platform</p>
        </div>

        <Card className="glass-card border-white/10 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Authentication</CardTitle>
            <CardDescription>Enter your admin credentials</CardDescription>
          </CardHeader>
          <CardContent>
            {searchParams?.message && (
              <Alert variant="destructive" className="mb-6 border-red-500/50 bg-red-500/10 text-red-300">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <AlertDescription>{searchParams.message}</AlertDescription>
              </Alert>
            )}

            <form className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Master Password</label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500 h-11"
                />
              </div>
              <Button 
                formAction={login} 
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              >
                Secure Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-zinc-500 mt-8">
          Unauthorized access is strictly prohibited.
        </p>
      </div>
    </div>
  )
}
