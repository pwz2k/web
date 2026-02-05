'use client';

import { login, loginWithFormData } from '@/actions/login';
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
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export default function SignInForm() {
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get('callbackUrl');

  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');
  const [isPending, startTransition] = useTransition();
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError('');
    setSuccess('');

    startTransition(() => {
      login(values, callbackUrl)
        .then((data) => {
          if (data?.error) {
            setError(data.error);
          }

          if (data?.success) {
            form.reset();
            setSuccess(data.success);
          }
        })
        .catch(() => {
          setError('Something went wrong. Please try again.');
        });
    });
  };

  return (
    <Form {...form}>
      <form
        className='space-y-6'
        action={loginWithFormData as (formData: FormData) => Promise<void>}
        method='post'
        onSubmit={form.handleSubmit(onSubmit)}
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
                  disabled={isPending}
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
                  disabled={isPending}
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
          disabled={isPending}
          variant='tertiary'
          className='w-full py-6 font-medium'
        >
          Sign In
        </Button>
      </form>
    </Form>
  );
}
