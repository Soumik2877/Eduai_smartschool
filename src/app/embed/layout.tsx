export const metadata = { title: 'Preview - EduAI' }

// Minimal chrome-free layout for admin read-only dashboard previews (used in iframes).
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-50 p-4">{children}</div>
}
