'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '/assets/logo.png';
import Image from 'next/image';
import { signIn, useSession } from 'next-auth/react';
import { useFormik } from 'formik';

export default function SignIn() {
  const session = useSession();
  const router = useRouter();

  type FormDataType = {
    email: string;
    password: string;
  };

  const initialValues: FormDataType = {
    email: '',
    password: '',
  };

  const formik = useFormik({
    initialValues: initialValues,
    validate: (data: FormDataType) => {
      let errors: { [key: string]: string } = {};
      //check is empty
      ['email', 'password'].forEach((element: string) => {
        if (data[element as keyof FormDataType] === '') {
          errors[element as keyof FormDataType] = 'This field is required !';
        }
      });
      return errors;
    },
    onSubmit: (data: FormDataType) => {
      if (data) {
        signIn('credentials', {
          email: formik.values['email'],
          password: formik.values['password'],
        }).then(()=>{
          router.push('/')
        });
      }
    },
  });

  //redirect on auth
  useEffect(() => {
    if (router && session && session.status === 'authenticated') {
      router.push('/');
    }
  }, [session, router]);

  const isFormFieldInvalid = (name: keyof FormDataType) =>
    !!(formik.touched[name] && formik.errors[name]);

  const getFormErrorMessage = (name: keyof FormDataType) => {
    return isFormFieldInvalid(name) ? (
      <small className="text-red-700">{formik.errors[name]}</small>
    ) : (
      <small className="">&nbsp;</small>
    );
  };

  return (
    <>
      <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8 ">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <Image
            className="mx-auto h-20 w-auto"
            src={Logo}
            width="200"
            height="80"
            alt="logo"
          />
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 text-white-900 dark:text-white">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form
            method="POST"
            onSubmit={formik.handleSubmit}
            onReset={formik.handleReset}
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6 text-white-900 dark:text-white"
              >
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formik.values['email']}
                  onChange={(e) =>
                    formik.setFieldValue('email', e.target.value)
                  }
                  className="block w-full dark:text-white rounded-md border-0 px-4 py-1.5 text-black shadow-sm ring-1 ring-inset ring-black placeholder:text-black focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 dark:bg-gray-700"
                />
                {getFormErrorMessage('email')}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium leading-6 text-white-900 dark:text-white"
                >
                  Password
                </label>
                <div className="text-sm">
                  <a
                    href="#"
                    className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-200"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formik.values['password']}
                  autoComplete="current-password"
                  onChange={(e) =>
                    formik.setFieldValue('password', e.target.value)
                  }
                  className="block w-full dark:text-white rounded-md border-0 px-4 py-1.5 text-black shadow-sm ring-1 ring-inset ring-black placeholder:text-black focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-700"
                />
                {getFormErrorMessage('password')}
              </div>
            </div>

            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Sign in
            </button>
          </form>
          <div className="mt-5 flex items-center justify-center">
            <button
              className="px-4 py-2 justify-center w-full border flex gap-2 border-slate-200 rounded-lg text-slate-700 hover:border-slate-400 hover:text-slate-900 hover:shadow transition duration-150 dark:border-white dark:text-white dark:hover:text-gray-900 dark:hover:border-gray-400 dark:hover:shadow-lg"
              onClick={(e) => signIn('google')}
            >
              <Image
                width={60}
                height={60}
                className="w-6 h-6"
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                loading="lazy"
                alt="google logo"
              />
              <span className="text-black dark:text-white">Login with Google</span>
            </button>
          </div>

          <p className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Not a member?{' '}
            <a
              onClick={() => router.push('signup')}
              className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500 dark:text-indigo-200"
            >
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
