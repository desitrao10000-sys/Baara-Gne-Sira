"use client";

import { ArrowLeft, User } from "lucide-react";

interface HeaderProps {
  title: string;
  showBack: boolean;
  onBack: () => void;
}

export default function Header({ title, showBack, onBack }: HeaderProps) {
  return (
    <header className="textured-navy p-4 flex justify-between items-center z-50 shrink-0">
      <div className="flex items-center gap-3">
        {showBack && (
          <button onClick={onBack} className="text-white p-1">
            <ArrowLeft size={24} />
          </button>
        )}
        <h1 className="text-xl font-black tracking-wider text-white">
          {title}
        </h1>
      </div>
      <div className="w-10 h-10 rounded-full border-2 border-primary-yellow flex items-center justify-center">
        <User className="text-primary-yellow" size={24} />
      </div>
    </header>
  );
}
