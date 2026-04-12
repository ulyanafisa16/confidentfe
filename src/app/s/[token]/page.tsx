// src/app/s/[token]/page.tsx

import SecretAccessPage from '../../../components/secret/SecretAccessPage'

interface Props {
  params: Promise<{ token: string }>
}

export default async function Page({ params }: Props) {
  const { token } = await params
  return <SecretAccessPage token={token} />
}