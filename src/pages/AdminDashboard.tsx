import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, CalendarDays, ChevronLeft, ChevronRight, FileStack, Globe2, Tags, Users, Eye, Newspaper, MapPinned } from 'lucide-react';

type Overview = {
  totalUsers: number;
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalPages: number;
  siteViewCount: number;
  blogPageViewCount: number;
  totalPostViews: number;
};

type CalendarPost = {
  id: string;
  title: string;
  slug: string;
  status: string;
  authorName: string;
};

type CalendarEntry = {
  date: string;
  count: number;
  posts: CalendarPost[];
};

type UserPublicationItem = {
  userId: string;
  name: string;
  email: string;
  role: string;
  publicationCount: number;
  publishedCount: number;
};

type TagPublicationItem = {
  _id: string;
  tagName: string;
  tagSlug: string;
  publicationCount: number;
  totalViews: number;
};

type TopPostItem = {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  status: string;
  createdAt: string;
  authorName: string;
};

type TopPageItem = {
  path: string;
  label: string;
  viewCount: number;
  lastUpdatedAt: string;
};

type DashboardResponse = {
  overview: Overview;
  publicationCalendar: CalendarEntry[];
  calendarMonth: { year: number; month: number };
  usersByPublicationCount: UserPublicationItem[];
  publicationsByTag: TagPublicationItem[];
  topPagesByViews: TopPageItem[];
  topPostsByViews: TopPostItem[];
};

const monthFormatter = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' });
const dayFormatter = new Intl.DateTimeFormat('es-CL', { day: 'numeric' });

function getStatusBadge(status: string) {
  if (status === 'published') return 'bg-emerald-50 text-emerald-700';
  if (status === 'in_review') return 'bg-sky-50 text-sky-700';
  if (status === 'changes_requested') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const { default: fetchApi } = await import('../lib/api');
        const response = await fetchApi(`/api/admin/dashboard?month=${selectedMonth.month}&year=${selectedMonth.year}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          setDashboard(await response.json());
          return;
        }

        if (response.status === 403) {
          navigate('/profile', { replace: true });
        }
      } catch (error) {
        console.error('Error fetching admin dashboard', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate, selectedMonth.month, selectedMonth.year]);

  const calendarCells = useMemo(() => {
    if (!dashboard) return [] as Array<{ date: Date | null; key: string; entry?: CalendarEntry }>;

    const firstOfMonth = new Date(dashboard.calendarMonth.year, dashboard.calendarMonth.month, 1);
    const startDay = firstOfMonth.getDay();
    const daysInMonth = new Date(dashboard.calendarMonth.year, dashboard.calendarMonth.month + 1, 0).getDate();
    const entriesByDate = new Map(dashboard.publicationCalendar.map((entry) => [entry.date, entry]));
    const cells: Array<{ date: Date | null; key: string; entry?: CalendarEntry }> = [];

    for (let index = 0; index < startDay; index += 1) {
      cells.push({ date: null, key: `empty-start-${index}` });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const currentDate = new Date(dashboard.calendarMonth.year, dashboard.calendarMonth.month, day);
      const dateKey = currentDate.toISOString().slice(0, 10);
      cells.push({ date: currentDate, key: dateKey, entry: entriesByDate.get(dateKey) });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ date: null, key: `empty-end-${cells.length}` });
    }

    return cells;
  }, [dashboard]);

  const overviewCards = dashboard ? [
    { label: 'Usuarios', value: dashboard.overview.totalUsers, icon: Users, tone: 'text-brand-blue' },
    { label: 'Publicaciones', value: dashboard.overview.totalPosts, icon: Newspaper, tone: 'text-brand-red' },
    { label: 'Páginas', value: dashboard.overview.totalPages, icon: FileStack, tone: 'text-slate-700' },
    { label: 'Visitas del sitio', value: dashboard.overview.siteViewCount, icon: Globe2, tone: 'text-emerald-700' },
    { label: 'Visitas al blog', value: dashboard.overview.blogPageViewCount, icon: BarChart3, tone: 'text-sky-700' },
    { label: 'Vistas de publicaciones', value: dashboard.overview.totalPostViews, icon: Eye, tone: 'text-amber-700' },
  ] : [];

  const changeMonth = (direction: -1 | 1) => {
    setSelectedMonth((current) => {
      const nextDate = new Date(current.year, current.month + direction, 1);
      return {
        year: nextDate.getFullYear(),
        month: nextDate.getMonth(),
      };
    });
  };

  return (
    <div className="container mx-auto px-4 py-8" style={{ marginTop: 75 }}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center space-x-2 text-brand-blue hover:underline">
          <ArrowLeft size={18} />
          <span>Atrás</span>
        </button>
        <Link to="/blog/manage" className="inline-flex items-center rounded-full bg-brand-blue px-5 py-2 text-sm font-bold text-white hover:bg-brand-red transition-all">
          Ir a gestión del blog
        </Link>
      </div>

      <div className="space-y-8">
        <section className="rounded-[28px] border border-brand-blue/10 bg-gradient-to-br from-slate-50 via-white to-brand-blue/5 p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-brand-blue">
                <BarChart3 size={14} />
                <span>Dashboard Admin</span>
              </div>
              <h1 className="mt-4 text-4xl font-black text-brand-blue">Control general del sitio</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-600">
                Resumen operativo del portal, calendario editorial del mes, productividad por usuario, uso de tags y comportamiento de visitas.
              </p>
            </div>
            {dashboard && (
              <div className="rounded-3xl bg-white/90 px-5 py-4 shadow-sm ring-1 ring-brand-blue/10">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Estado editorial</div>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-3xl font-black text-brand-blue">{dashboard.overview.publishedPosts.toLocaleString('es-CL')}</span>
                  <span className="text-sm font-semibold text-slate-500">publicadas</span>
                </div>
                <div className="mt-1 text-sm text-slate-500">{dashboard.overview.draftPosts.toLocaleString('es-CL')} en borrador o revisión</div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16 text-brand-blue">Cargando dashboard...</div>
          ) : dashboard ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {overviewCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="rounded-3xl bg-white px-5 py-5 shadow-sm ring-1 ring-brand-blue/10">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{card.label}</div>
                      <Icon size={18} className={card.tone} />
                    </div>
                    <div className="mt-3 text-3xl font-black text-slate-900">{card.value.toLocaleString('es-CL')}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl bg-white px-6 py-12 text-center text-slate-500 shadow-sm ring-1 ring-brand-blue/10">
              No se pudo cargar la información del dashboard.
            </div>
          )}
        </section>

        {dashboard && (
          <div className="grid gap-8 xl:grid-cols-[1.35fr_0.95fr]">
            <section className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <CalendarDays className="text-brand-red" size={24} />
                <div>
                  <h2 className="text-2xl font-black text-brand-blue">Calendario de publicaciones</h2>
                  <p className="text-sm text-slate-500">{monthFormatter.format(new Date(dashboard.calendarMonth.year, dashboard.calendarMonth.month, 1))}</p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <button type="button" onClick={() => changeMonth(-1)} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-blue shadow-sm ring-1 ring-brand-blue/10 hover:bg-brand-blue hover:text-white transition-all">
                  <ChevronLeft size={16} />
                  <span>Mes anterior</span>
                </button>
                <div className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                  {monthFormatter.format(new Date(dashboard.calendarMonth.year, dashboard.calendarMonth.month, 1))}
                </div>
                <button type="button" onClick={() => changeMonth(1)} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-blue shadow-sm ring-1 ring-brand-blue/10 hover:bg-brand-blue hover:text-white transition-all">
                  <span>Mes siguiente</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                  <div key={day} className="py-2">{day}</div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-2">
                {calendarCells.map((cell) => (
                  <div key={cell.key} className={`min-h-28 rounded-2xl border p-3 ${cell.entry ? 'border-brand-blue/20 bg-brand-blue/5' : 'border-slate-100 bg-slate-50/60'}`}>
                    {cell.date ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-slate-700">{dayFormatter.format(cell.date)}</span>
                          {cell.entry && <span className="rounded-full bg-brand-red px-2 py-0.5 text-[10px] font-black text-white">{cell.entry.count}</span>}
                        </div>
                        <div className="mt-3 space-y-2">
                          {cell.entry?.posts.slice(0, 2).map((post) => (
                            <div key={post.id} className="rounded-xl bg-white px-2 py-2 shadow-sm ring-1 ring-brand-blue/5">
                              <div className="line-clamp-2 text-xs font-bold text-brand-blue">{post.title}</div>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${getStatusBadge(post.status)}`}>{post.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-8">
              <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <Tags className="text-brand-red" size={22} />
                  <h2 className="text-xl font-black text-brand-blue">Publicaciones por tag</h2>
                </div>
                <div className="mt-5 space-y-3">
                  {dashboard.publicationsByTag.slice(0, 8).map((tag) => (
                    <div key={tag._id} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-brand-blue">#{tag.tagName}</div>
                          <div className="text-xs text-slate-500">/{tag.tagSlug}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-brand-red">{tag.publicationCount.toLocaleString('es-CL')}</div>
                          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">publicaciones</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!dashboard.publicationsByTag.length && <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">No hay tags asociados a publicaciones.</div>}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <MapPinned className="text-brand-red" size={22} />
                  <h2 className="text-xl font-black text-brand-blue">Páginas más visitadas</h2>
                </div>
                <div className="mt-5 space-y-3">
                  {dashboard.topPagesByViews.map((page) => (
                    <div key={page.path} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-brand-blue">{page.label}</div>
                          <div className="mt-1 text-xs text-slate-500">{page.path}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-brand-red">{page.viewCount.toLocaleString('es-CL')}</div>
                          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">visitas</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!dashboard.topPagesByViews.length && (
                    <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">Aún no hay rutas públicas con visitas registradas.</div>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <Eye className="text-brand-red" size={22} />
                  <h2 className="text-xl font-black text-brand-blue">Blogs más vistos</h2>
                </div>
                <div className="mt-5 space-y-3">
                  {dashboard.topPostsByViews.map((post) => (
                    <div key={post.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-brand-blue">{post.title}</div>
                          <div className="mt-1 text-xs text-slate-500">{post.authorName}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-brand-red">{post.viewCount.toLocaleString('es-CL')}</div>
                          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">vistas</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {dashboard && (
          <div className="grid gap-8 xl:grid-cols-2">
            <section className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Users className="text-brand-red" size={22} />
                <h2 className="text-xl font-black text-brand-blue">Usuarios y cantidad de publicaciones</h2>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-left">
                      <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Usuario</th>
                      <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Rol</th>
                      <th className="px-3 py-3 text-right text-xs font-black uppercase tracking-[0.18em] text-slate-400">Total</th>
                      <th className="px-3 py-3 text-right text-xs font-black uppercase tracking-[0.18em] text-slate-400">Publicadas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {dashboard.usersByPublicationCount.map((user) => (
                      <tr key={user.userId}>
                        <td className="px-3 py-4">
                          <div className="font-bold text-brand-blue">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </td>
                        <td className="px-3 py-4 text-sm text-slate-500">{user.role}</td>
                        <td className="px-3 py-4 text-right font-black text-brand-blue">{user.publicationCount.toLocaleString('es-CL')}</td>
                        <td className="px-3 py-4 text-right font-black text-brand-red">{user.publishedCount.toLocaleString('es-CL')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Globe2 className="text-brand-red" size={22} />
                <h2 className="text-xl font-black text-brand-blue">Visitas clave</h2>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl bg-slate-50 px-5 py-5">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Sitio completo</div>
                  <div className="mt-3 text-3xl font-black text-brand-blue">{dashboard.overview.siteViewCount.toLocaleString('es-CL')}</div>
                </div>
                <div className="rounded-3xl bg-slate-50 px-5 py-5">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Portada blog</div>
                  <div className="mt-3 text-3xl font-black text-brand-red">{dashboard.overview.blogPageViewCount.toLocaleString('es-CL')}</div>
                </div>
                <div className="rounded-3xl bg-slate-50 px-5 py-5">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Blogs acumulados</div>
                  <div className="mt-3 text-3xl font-black text-emerald-700">{dashboard.overview.totalPostViews.toLocaleString('es-CL')}</div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}