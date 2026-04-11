import { paths } from "@/app/paths"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export function SignUpForm({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="p-6 md:p-8">
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold">Create an account</h1>
              <p className="text-balance text-muted-foreground">
                Demo: self-service sign-up is disabled. Use the demo sign-in flow or contact an
                admin.
              </p>
            </div>
            <Field>
              <FieldLabel htmlFor="signup-email">Email</FieldLabel>
              <Input id="signup-email" type="email" placeholder="m@example.com" disabled />
            </Field>
            <Field>
              <FieldLabel htmlFor="signup-password">Password</FieldLabel>
              <Input id="signup-password" type="password" disabled />
            </Field>
            <Field>
              <Button type="button" className="w-full" disabled>
                Sign up (disabled in demo)
              </Button>
            </Field>
            <FieldDescription className="text-center">
              Already have an account?{" "}
                <Link href={paths.signIn} className="underline underline-offset-2">
                Sign in
              </Link>
            </FieldDescription>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}
