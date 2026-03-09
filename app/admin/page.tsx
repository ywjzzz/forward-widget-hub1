"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Loader2,
  ArrowRight,
  AlertCircle,
  Trash2,
  FileCode,
  FileJson,
  Lock,
} from "lucide-react";

interface Module {
  id: string;
  filename: string;
  title: string;
  version: string;
  author: string;
  file_size: number;
  is_encrypted: number;
}

interface Collection {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon_url: string;
  user_id: string;
  created_at: number;
  updated_at: number;
  modules: Module[];
}

export default function AdminPage() {
  const [authState, setAuthState] = useState<
    "loading" | "disabled" | "need-password" | "authenticated"
  >("loading");
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((data) => {
        if (!data.enabled) {
          setAuthState("disabled");
        } else if (data.authenticated) {
          setAuthState("authenticated");
        } else {
          setAuthState("need-password");
        }
      })
      .catch(() => setAuthState("disabled"));
  }, []);

  const fetchCollections = useCallback(async () => {
    setCollectionsLoading(true);
    try {
      const res = await fetch("/api/admin/collections");
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections);
      }
    } finally {
      setCollectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authState === "authenticated") fetchCollections();
  }, [authState, fetchCollections]);

  const handlePasswordSubmit = async () => {
    if (!passwordInput.trim()) return;
    setPasswordLoading(true);
    setPasswordError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      if (res.ok) {
        setAuthState("authenticated");
      } else {
        setPasswordError("密码错误");
      }
    } catch {
      setPasswordError("网络错误");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteModule = async (colId: string, mod: Module) => {
    if (!confirm(`确定删除模块「${mod.title || mod.filename}」？此操作不可恢复。`))
      return;
    setDeletingModuleId(mod.id);
    try {
      const res = await fetch(`/api/admin/modules/${mod.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCollections((prev) =>
          prev.map((c) =>
            c.id === colId
              ? { ...c, modules: c.modules.filter((m) => m.id !== mod.id) }
              : c
          )
        );
      }
    } finally {
      setDeletingModuleId(null);
    }
  };

  const handleDeleteCollection = async (col: Collection) => {
    if (!confirm(`确定删除合集「${col.title}」及其所有模块？此操作不可恢复。`))
      return;
    setDeletingId(col.id);
    try {
      const res = await fetch(`/api/admin/collections/${col.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCollections((prev) => prev.filter((c) => c.id !== col.id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (authState === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (authState === "disabled") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">管理后台未启用</h1>
          <p className="text-sm text-slate-500">
            请设置 <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">ADMIN_PASSWORD</code> 环境变量以启用管理后台。
          </p>
        </div>
      </div>
    );
  }

  if (authState === "need-password") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">管理后台</h1>
            <p className="text-sm text-slate-500">请输入管理员密码</p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePasswordSubmit();
              }}
              placeholder="请输入管理员密码"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              autoFocus
            />
            {passwordError && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {passwordError}
              </p>
            )}
            <button
              onClick={handlePasswordSubmit}
              disabled={passwordLoading || !passwordInput.trim()}
              className="w-full py-3 bg-orange-600 text-white text-sm font-medium rounded-xl hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {passwordLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalModules = collections.reduce(
    (sum, c) => sum + c.modules.length,
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">管理后台</h1>
              <p className="text-sm text-slate-500">
                {collections.length} 个合集 · {totalModules} 个模块
              </p>
            </div>
          </div>
          <a
            href="/"
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            返回首页
          </a>
        </div>

        {/* Loading */}
        {collectionsLoading && collections.length === 0 && (
          <div className="text-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
          </div>
        )}

        {/* Empty */}
        {!collectionsLoading && collections.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            暂无合集
          </div>
        )}

        {/* Collections */}
        {collections.map((col) => (
          <div
            key={col.id}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          >
            {/* Collection Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {col.icon_url ? (
                    <img
                      src={col.icon_url}
                      alt=""
                      className="w-9 h-9 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <FileJson className="w-4.5 h-4.5 text-indigo-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {col.title}
                    </h3>
                    {col.description && (
                      <p className="text-xs text-slate-500">
                        {col.description}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">
                      ID: {col.id} · 用户: {col.user_id.slice(0, 8)}... ·
                      更新于{" "}
                      {new Date(col.updated_at * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                    {col.modules.length} 个模块
                  </span>
                  <button
                    onClick={() => handleDeleteCollection(col)}
                    disabled={deletingId === col.id}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="删除合集"
                  >
                    {deletingId === col.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Modules */}
            <div className="divide-y divide-slate-100">
              {col.modules.map((mod) => (
                <div
                  key={mod.id}
                  className="px-6 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600 flex-shrink-0">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-slate-800 truncate">
                        {mod.title || mod.filename}
                      </span>
                      {mod.version && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {mod.version}
                        </span>
                      )}
                      {mod.is_encrypted ? (
                        <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100">
                          加密
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-400">
                      {mod.filename} ·{" "}
                      {mod.file_size < 1024
                        ? `${mod.file_size} B`
                        : `${(mod.file_size / 1024).toFixed(1)} KB`}
                      {mod.author ? ` · ${mod.author}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteModule(col.id, mod)}
                    disabled={deletingModuleId === mod.id}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title="删除模块"
                  >
                    {deletingModuleId === mod.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
              {col.modules.length === 0 && (
                <div className="px-6 py-4 text-center text-sm text-slate-400">
                  暂无模块
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
