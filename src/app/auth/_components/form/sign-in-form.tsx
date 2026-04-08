'use client';

import { login, loginWithFormData } from '@/actions/login';

/** Form action fallback when client JS fails; cast so form action type (void) is satisfied. */
const signInFormAction = loginWithFormData as unknown as (
  formData: FormData
) => Promise<void>;
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { PasswordInput } from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoginSchema } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Check if error is a Next.js redirect error
function isRedirectError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message === 'NEXT_REDIRECT' ||
      ('digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')))
  );
}

export default function SignInForm() {
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get('callbackUrl');

  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError('');
    setSuccess('');

    try {
      const data = await login(values, callbackUrl);
      if (data?.error) {
        setError(data.error);
      }
      if (data?.success) {
        form.reset();
        setSuccess(data.success);
      }
    } catch (error) {
      // Server `signIn` uses `redirect()` — must not swallow (breaks cookie + client nav until full reload).
      if (isRedirectError(error)) {
        throw error;
      }
      setError('Something went wrong. Please try again.');
    }
  });

  return (
    <Form {...form}>
      <form
        className='space-y-6'
        action={signInFormAction}
        method='post'
        onSubmit={onSubmit}
      >
        {callbackUrl ? (
          <input type='hidden' name='callbackUrl' value={callbackUrl} />
        ) : null}
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  type='email'
                  name='email'
                  placeholder='Email'
                  disabled={form.formState.isSubmitting}
                  className='rounded-full border border-white/10 bg-white/[0.03] px-4 py-6 backdrop-blur-xl'
                  autoComplete='email'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <PasswordInput
                  {...field}
                  name='password'
                  placeholder='Password'
                  className='rounded-full border border-white/10 bg-white/[0.03] px-4 py-6 backdrop-blur-xl'
                  disabled={form.formState.isSubmitting}
                  autoComplete='current-password'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormSuccess message={success} />
        <FormError message={error} />
        <Button
          type='submit'
          disabled={form.formState.isSubmitting}
          variant='tertiary'
          className='w-full py-6 font-medium'
        >
          Sign In
        </Button>
      </form>
    </Form>
  );
}
