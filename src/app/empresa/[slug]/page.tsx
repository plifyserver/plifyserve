import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function EmpresaPublicPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: page, error } = await supabase
    .from('company_pages')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !page || !page.company_name) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            {page.logo_url ? (
              <Image src={page.logo_url} alt={page.company_name} width={40} height={40} className="rounded-lg" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-avocado flex items-center justify-center text-white font-bold">
                {page.company_name.charAt(0)}
              </div>
            )}
            {page.company_name}
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {page.slogan && (
          <p className="text-xl text-avocado font-medium mb-8">{page.slogan}</p>
        )}
        {page.about_text && (
          <div className="prose prose-gray max-w-none mb-12">
            <p className="text-gray-600 whitespace-pre-line">{page.about_text}</p>
          </div>
        )}

        <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Contato</h2>
          <div className="space-y-2">
            {page.contact_email && (
              <p>
                <span className="text-gray-500">Email:</span>{' '}
                <a href={`mailto:${page.contact_email}`} className="text-avocado hover:underline">
                  {page.contact_email}
                </a>
              </p>
            )}
            {page.contact_phone && (
              <p>
                <span className="text-gray-500">Telefone:</span>{' '}
                <a href={`tel:${page.contact_phone}`} className="text-avocado hover:underline">
                  {page.contact_phone}
                </a>
              </p>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} {page.company_name}
        </div>
      </footer>
    </div>
  )
}
