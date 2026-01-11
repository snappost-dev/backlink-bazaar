'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 shadow-lg border border-slate-200">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Bir Hata Oluştu</h1>
          <p className="text-slate-600">
            {error.message || 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'}
          </p>
          {error.digest && (
            <p className="text-xs text-slate-400 font-mono">Error ID: {error.digest}</p>
          )}
          <Button
            onClick={reset}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 rounded-[2.5rem]"
          >
            Tekrar Dene
          </Button>
        </div>
      </div>
    </div>
  );
}

