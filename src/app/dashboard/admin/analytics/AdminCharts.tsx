'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from 'recharts'

const PALETTE = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

export default function AdminCharts({ classComparison, subjectAverages, distribution, quizTrend, focusByClass }: {
  classComparison: { name: string; avg: number }[]
  subjectAverages: { name: string; avg: number }[]
  distribution: { name: string; count: number }[]
  quizTrend: { label: string; avg: number }[]
  focusByClass: { name: string; mins: number }[]
}) {
  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="card p-5">
      <h2 className="font-extrabold text-gray-900 text-base mb-4">{title}</h2>
      {children}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card title="Average Score by Class (%)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={classComparison}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Class Avg']} />
              <Bar dataKey="avg" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                {classComparison.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Grade Distribution (students)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={distribution}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => [`${v} students`, 'Count']} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                {distribution.map((_, i) => <Cell key={i} fill={['#EF4444', '#F59E0B', '#FBBF24', '#34D399', '#10B981'][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Average Score by Subject (%)">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={subjectAverages} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: any) => [`${v}%`, 'Avg']} />
            <Bar dataKey="avg" radius={[0, 6, 6, 0]} isAnimationActive={false}>
              {subjectAverages.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card title="School Quiz Score Trend (%)">
          {quizTrend.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={quizTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any) => [`${v}%`, 'School Avg']} />
                <Line type="monotone" dataKey="avg" stroke="#4F46E5" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">No quiz data.</div>}
        </Card>

        <Card title="Avg Weekly Focus by Class (hrs/student)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={focusByClass}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => [`${v} hrs`, 'Focus']} />
              <Bar dataKey="mins" fill="#10B981" radius={[6, 6, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
