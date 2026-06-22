"use client"

import { paths, assetPaths } from "@/app/paths"
import { cn } from "@/lib/utils"
import { signInWithDemo } from "@/features/auth/actions/demo-sign-in"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field"
import Link from "next/link"

type SignInFormProps = React.ComponentProps<"div"> & {
  errorMessage?: string | null
  /** Post-login redirect; must be a same-origin path (validated in the server action). */
  nextPath?: string
}

export function SignInForm({
  className,
  errorMessage,
  nextPath,
  ...props
}: SignInFormProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="my-auto mx-auto overflow-hidden p-0 w-[400px] max-w-[400px]">
        <CardContent className="grid p-0 md:grid-cols-1 ">
          <form className="p-8 md:p-10" action={signInWithDemo}>
            {nextPath ? (
              <input type="hidden" name="next" value={nextPath} />
            ) : null}
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground">
                  Sign in to your Jenjco account (demo)
                </p>
                {errorMessage ? (
                  <div
                    role="alert"
                    className="w-full rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
                  >
                    {errorMessage}
                  </div>
                ) : null}
              </div>
              <Field>
                <Button variant={"default"} type="submit" className="w-full ">
                  Sign in with Demo
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <TooltipProvider delayDuration={200}>
                <Field className="flex">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="inline-flex w-full">
                        <Button
                          variant="outline"
                          type="button"
                          disabled
                          aria-disabled="true"
                          className="w-full"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                              fill="currentColor"
                            />
                          </svg>
                          <div className="sr-only">Login with Google</div>
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Disabled for Demo</TooltipContent>
                  </Tooltip>
                </Field>
              </TooltipProvider>
              <FieldDescription className="text-center">
                Don&apos;t have an account?{" "}
                <Link
                  href={paths.signUp}
                  className="underline underline-offset-2"
                >
                  Contact
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          {/* <div className="relative hidden bg-muted md:block">
            <img
              src={assetPaths.placeholder}
              alt=""
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div> */}
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
