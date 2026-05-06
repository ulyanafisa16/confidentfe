import type {
  ContentToScan,
  ClientRuleResult,
  ClientDetectionResult
} from '../types'


const SCORE_FLAG  = 40   // ≥ ini → flagged
const SCORE_BLOCK = 70   // ≥ ini → blocked (tampilkan warning ke user)
 
 
// ─────────────────────────────────────────────────────────────────
// Helper — Luhn Algorithm untuk validasi nomor kartu kredit
// ─────────────────────────────────────────────────────────────────
 
function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) return false
 
  let sum     = 0
  let isEven  = false
 
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10)
    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum    += digit
    isEven  = !isEven
  }
  return sum % 10 === 0
}
 
// ─────────────────────────────────────────────────────────────────
// Individual Rules
// ─────────────────────────────────────────────────────────────────
 
function rulePIICreditCard(content: ContentToScan): ClientRuleResult {
  const text = content.text || ''
  // Regex pola nomor kartu kredit (Visa, Mastercard, Amex, dll)
  const CC_RE = /\b(?:\d[ -]?){13,16}\d\b/g
  const matches = text.match(CC_RE) || []
 
  const valid = matches.filter(m => luhnCheck(m.replace(/\D/g, '')))
 
  if (valid.length > 0) {
    return {
      rule_name:   'pii_credit_card',
      triggered:   true,
      score_delta: 45,
      severity:    'high',
      detail:      `Terdeteksi ${valid.length} kemungkinan nomor kartu kredit valid (Luhn check passed).`,
    }
  }
  return { rule_name: 'pii_credit_card', triggered: false, score_delta: 0, severity: 'high', detail: '' }
}
 
 
function rulePIIIdNumber(content: ContentToScan): ClientRuleResult {
  const text = content.text || ''
  // NIK Indonesia: 16 digit, dimulai dengan kode provinsi 1-9 atau 11-99
  const NIK_RE = /\b[1-9]\d{15}\b/g
  const matches = text.match(NIK_RE) || []
 
  if (matches.length > 0) {
    return {
      rule_name:   'pii_id_number',
      triggered:   true,
      score_delta: 30,
      severity:    'high',
      detail:      `Terdeteksi ${matches.length} kemungkinan nomor NIK/KTP Indonesia.`,
    }
  }
  return { rule_name: 'pii_id_number', triggered: false, score_delta: 0, severity: 'high', detail: '' }
}
 
 
function rulePIIPhoneNumber(content: ContentToScan): ClientRuleResult {
  const text = content.text || ''
  // Nomor telepon Indonesia: +62xxx, 08xxx, 62xxx
  const PHONE_RE = /(?:\+62|62|0)[\s-]?8[\d][\d][\s-]?[\d]{4,8}/g
  const matches  = text.match(PHONE_RE) || []
 
  // Hanya flag kalau ada banyak nomor (> 3) — satu nomor bisa saja legitimate
  if (matches.length > 3) {
    return {
      rule_name:   'pii_phone_mass',
      triggered:   true,
      score_delta: 20,
      severity:    'medium',
      detail:      `Terdeteksi ${matches.length} nomor telepon Indonesia — kemungkinan daftar kontak.`,
    }
  }
  return { rule_name: 'pii_phone_mass', triggered: false, score_delta: 0, severity: 'medium', detail: '' }
}
 
 
function rulePIIEmailMass(content: ContentToScan): ClientRuleResult {
  const text    = content.text || ''
  const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const matches  = text.match(EMAIL_RE) || []
 
  // Flag kalau ada > 5 email berbeda — indikasi daftar email
  const unique = [...new Set(matches)]
  if (unique.length > 5) {
    return {
      rule_name:   'pii_email_mass',
      triggered:   true,
      score_delta: 15,
      severity:    'medium',
      detail:      `Terdeteksi ${unique.length} alamat email unik — kemungkinan daftar email.`,
    }
  }
  return { rule_name: 'pii_email_mass', triggered: false, score_delta: 0, severity: 'medium', detail: '' }
}
 
 
function ruleCredentialPrivateKey(content: ContentToScan): ClientRuleResult {
  const text = content.text || ''
  // PEM private key header
  const PEM_RE = /-----BEGIN\s+(?:RSA\s+|EC\s+|DSA\s+|OPENSSH\s+)?PRIVATE KEY-----/i
 
  if (PEM_RE.test(text)) {
    return {
      rule_name:   'credential_private_key',
      triggered:   true,
      score_delta: 55,
      severity:    'critical',
      detail:      'Terdeteksi private key PEM. Pastikan ini memang yang ingin dikirim.',
    }
  }
  return { rule_name: 'credential_private_key', triggered: false, score_delta: 0, severity: 'critical', detail: '' }
}
 
 
function ruleCredentialApiKey(content: ContentToScan): ClientRuleResult {
  const text = content.text || ''
 
  // Pola API key / token umum
  const patterns = [
    { re: /sk-[a-zA-Z0-9]{32,}/,           label: 'OpenAI API key' },
    { re: /AIza[0-9A-Za-z-_]{35}/,          label: 'Google API key' },
    { re: /AKIA[0-9A-Z]{16}/,               label: 'AWS Access Key ID' },
    { re: /ghp_[a-zA-Z0-9]{36}/,            label: 'GitHub Personal Access Token' },
    { re: /xox[baprs]-[a-zA-Z0-9-]+/,       label: 'Slack token' },
    { re: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/, label: 'SendGrid API key' },
    { re: /Bearer\s+[a-zA-Z0-9_\-.]{20,}/i, label: 'Bearer token' },
  ]
 
  for (const { re, label } of patterns) {
    if (re.test(text)) {
      return {
        rule_name:   'credential_api_key',
        triggered:   true,
        score_delta: 40,
        severity:    'high',
        detail:      `Terdeteksi pola ${label}.`,
      }
    }
  }
  return { rule_name: 'credential_api_key', triggered: false, score_delta: 0, severity: 'high', detail: '' }
}
 
 
function ruleCredentialPassword(content: ContentToScan): ClientRuleResult {
  const text = content.text || ''
  // Pola password dalam format key=value, key: value
  const PASS_RE = /(?:password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]\s*\S+/gi
  const matches  = text.match(PASS_RE) || []
 
  if (matches.length > 0) {
    return {
      rule_name:   'credential_password_pattern',
      triggered:   true,
      score_delta: 25,
      severity:    'medium',
      detail:      `Terdeteksi ${matches.length} pola credential (password=, token=, dll).`,
    }
  }
  return { rule_name: 'credential_password_pattern', triggered: false, score_delta: 0, severity: 'medium', detail: '' }
}
 
 
function ruleUrlSuspicious(content: ContentToScan): ClientRuleResult {
  const text = content.text || ''
 
  // URL shortener yang sering dipakai phishing
  const SHORTENER_RE = /https?:\/\/(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|adf\.ly|short\.io)\/\S+/gi
 
  // Pola URL phishing umum
  const PHISHING_RE = /https?:\/\/[^\s]*(?:login|signin|account|verify|secure|update|confirm|bank|paypal|amazon|google|microsoft)[^\s]*\.[a-z]{2,}\/[^\s]*/gi
 
  const shorteners = text.match(SHORTENER_RE) || []
  const phishing   = text.match(PHISHING_RE)  || []
 
  if (shorteners.length > 0 || phishing.length > 0) {
    const total = shorteners.length + phishing.length
    return {
      rule_name:   'url_suspicious',
      triggered:   true,
      score_delta: 30,
      severity:    'high',
      detail:      `Terdeteksi ${total} URL mencurigakan (${shorteners.length} shortener, ${phishing.length} pola phishing).`,
    }
  }
  return { rule_name: 'url_suspicious', triggered: false, score_delta: 0, severity: 'high', detail: '' }
}
 
 
function ruleKeywordDangerous(content: ContentToScan): ClientRuleResult {
  const text = (content.text || '').toLowerCase()
 
  // Keyword berbahaya — grouped by category
  const DANGEROUS_KEYWORDS = [
    // Malware/exploit
    'ransomware', 'malware', 'exploit', 'payload', 'shellcode',
    'reverse shell', 'metasploit', 'meterpreter', 'mimikatz',
    // Illegal activity
    'carding', 'phishing kit', 'credential stuffing',
    // Violence (basic)
    'bomb making', 'how to make bomb', 'cara membuat bom',
  ]
 
  const found = DANGEROUS_KEYWORDS.filter(kw => text.includes(kw))
 
  if (found.length >= 2) {
    // Perlu minimal 2 keyword supaya tidak false positive dari satu kata
    return {
      rule_name:   'keyword_dangerous',
      triggered:   true,
      score_delta: 35,
      severity:    'high',
      detail:      `Terdeteksi ${found.length} keyword berbahaya: ${found.slice(0, 3).join(', ')}.`,
    }
  }
  return { rule_name: 'keyword_dangerous', triggered: false, score_delta: 0, severity: 'high', detail: '' }
}
 
 
function ruleEncodingAnomaly(content: ContentToScan): ClientRuleResult {
  const text = content.text || ''
  if (!text || text.length < 50) {
    return { rule_name: 'encoding_anomaly', triggered: false, score_delta: 0, severity: 'low', detail: '' }
  }
 
  // Hitung karakter non-printable (di luar range ASCII printable + UTF-8 normal)
  let nonPrintable = 0
  for (let i = 0; i < Math.min(text.length, 500); i++) {
    const code = text.charCodeAt(i)
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      nonPrintable++
    }
  }
 
  const ratio = nonPrintable / Math.min(text.length, 500)
  if (ratio > 0.1) {
    // > 10% karakter tidak normal
    return {
      rule_name:   'encoding_anomaly',
      triggered:   true,
      score_delta: 20,
      severity:    'medium',
      detail:      `${(ratio * 100).toFixed(1)}% karakter non-printable — kemungkinan binary data tersembunyi.`,
    }
  }
  return { rule_name: 'encoding_anomaly', triggered: false, score_delta: 0, severity: 'low', detail: '' }
}
 
 
// ─────────────────────────────────────────────────────────────────
// MAIN SCANNER
// ─────────────────────────────────────────────────────────────────
 
export function runClientDetection(content: ContentToScan): ClientDetectionResult {
  // File scan — hanya cek nama file dan MIME, bukan isi (tidak bisa baca binary)
  // Untuk tipe text/password/note — scan isi konten
  const isTextContent = ['text', 'password', 'note'].includes(content.secret_type)
 
  const allRules = [
    // Hanya jalankan content rules kalau ada teks
    ...(isTextContent && content.text ? [
      rulePIICreditCard,
      rulePIIIdNumber,
      rulePIIPhoneNumber,
      rulePIIEmailMass,
      ruleCredentialPrivateKey,
      ruleCredentialApiKey,
      ruleCredentialPassword,
      ruleUrlSuspicious,
      ruleKeywordDangerous,
      ruleEncodingAnomaly,
    ] : []),
  ]
 
  const results: ClientRuleResult[] = []
  let totalScore = 0
 
  for (const ruleFn of allRules) {
    try {
      const result = ruleFn(content)
      results.push(result)
 
      if (result.triggered) {
        totalScore += result.score_delta
        totalScore  = Math.min(totalScore, 100)
 
        console.debug(
          `[client-detection] Rule '${result.rule_name}' triggered: ` +
          `+${result.score_delta} → total ${totalScore}. ${result.detail}`
        )
      }
    } catch (err) {
      console.error(`[client-detection] Rule error:`, err)
    }
  }
 
  const triggered = results
    .filter(r => r.triggered)
    .map(r => r.rule_name)
 
  let action: 'allowed' | 'flagged' | 'blocked'
  if (totalScore >= SCORE_BLOCK)     action = 'blocked'
  else if (totalScore >= SCORE_FLAG) action = 'flagged'
  else                               action = 'allowed'
 
  console.info(
    `[client-detection] Score: ${totalScore}, Action: ${action}, ` +
    `Rules: ${triggered.join(', ') || 'none'}`
  )
 
  return {
    risk_score:      totalScore,
    action,
    rules_triggered: triggered,
    rule_details:    results,
    scanned_at:      new Date().toISOString(),
  }
}
 