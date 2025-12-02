import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-red-600">
                Authentication Error
              </CardTitle>
              <CardDescription>There was an error signing you in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We encountered an error while processing your GitHub authentication. 
                This could be due to a cancelled login or a temporary issue with the service.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild className="w-full">
                  <Link href="/auth/signin">Try Again</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">Go Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}