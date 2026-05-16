import type {
  ContentToScan,
  ClientRuleResult,
  ClientDetectionResult
} from '../types'


const SCORE_FLAG  = 40
 
// ─────────────────────────────────────────────────────────────────
// RULE 1 — Keyword berbahaya
// Hanya keyword yang benar-benar mengindikasikan aktivitas ilegal
// atau berbahaya, bukan konten sensitif yang sah.
// ─────────────────────────────────────────────────────────────────
 
function ruleKeywordDangerous(content: ContentToScan): ClientRuleResult {
  const text = (content.text || '').toLowerCase()
 
  const DANGEROUS = [
    // Instruksi pembuatan senjata/bahan peledak
    'cara membuat bom', 'bomb making', 'how to make explosive',
    'cara merakit senjata',
    // Malware/exploit yang spesifik dan jelas
    'shellcode exploit', 'ransomware payload', 'reverse shell payload',
    'meterpreter session', 'mimikatz dump',
    // Aktivitas kriminal siber yang spesifik
    'credential stuffing list', 'phishing kit download',
    'carding tutorial', 'skimmer device',
  ]
 
  // Perlu minimal 2 keyword untuk mengurangi false positive
  const found = DANGEROUS.filter(kw => text.includes(kw))
  if (found.length >= 2) {
    return {
      rule_name:   'keyword_dangerous',
      triggered:   true,
      score_delta: 40,
      severity:    'high',
      detail:      `Terdeteksi ${found.length} keyword mengindikasikan konten berbahaya.`,
    }
  }
  return { rule_name: 'keyword_dangerous', triggered: false, score_delta: 0, severity: 'high', detail: '' }
}
 
// ─────────────────────────────────────────────────────────────────
// RULE 2 — URL phishing yang jelas
// Hanya URL yang jelas menggunakan teknik typosquatting atau
// subdomain menyesatkan untuk meniru situs resmi.
// ─────────────────────────────────────────────────────────────────
 
function ruleUrlPhishing(content: ContentToScan): ClientRuleResult {
  const text = content.text || ''
 
  // Pola typosquatting yang jelas (bukan sekadar menyebut nama brand)
  const TYPOSQUAT_RE = /https?:\/\/[^\s]*(?:paypa1|g00gle|amaz0n|micros0ft|app1e|faceb00k|inst4gram)[^\s]*/gi
  // Subdomain menyesatkan: secure-login.randomdomain.com/paypal
  const SUBDOMAIN_RE = /https?:\/\/(?:secure|login|account|verify|update)[-.](?!(?:google|microsoft|apple|amazon|paypal|facebook)\.com)[^\s]+\/(?:paypal|google|apple|amazon|microsoft|facebook|bank)[^\s]*/gi
 
  const typosquat = text.match(TYPOSQUAT_RE) || []
  const subdomain  = text.match(SUBDOMAIN_RE) || []
  const total      = typosquat.length + subdomain.length
 
  if (total > 0) {
    return {
      rule_name:   'url_phishing',
      triggered:   true,
      score_delta: 35,
      severity:    'high',
      detail:      `Terdeteksi ${total} URL dengan pola phishing (typosquatting atau subdomain menyesatkan).`,
    }
  }
  return { rule_name: 'url_phishing', triggered: false, score_delta: 0, severity: 'high', detail: '' }
}
 
// ─────────────────────────────────────────────────────────────────
// RULE 3 — Encoding anomaly
// Teks dengan proporsi karakter non-printable yang tinggi
// mengindikasikan binary data yang disembunyikan dalam teks.
// ─────────────────────────────────────────────────────────────────
 
function ruleEncodingAnomaly(content: ContentToScan): ClientRuleResult {
  const text = content.text || ''
  if (!text || text.length < 100) {
    return { rule_name: 'encoding_anomaly', triggered: false, score_delta: 0, severity: 'low', detail: '' }
  }
 
  let nonPrintable = 0
  const sample = Math.min(text.length, 1000)
  for (let i = 0; i < sample; i++) {
    const code = text.charCodeAt(i)
    // Karakter di luar range printable (bukan tab, newline, carriage return)
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      nonPrintable++
    }
  }
 
  const ratio = nonPrintable / sample
  // Threshold 15% — cukup tinggi untuk hindari false positive
  if (ratio > 0.15) {
    return {
      rule_name:   'encoding_anomaly',
      triggered:   true,
      score_delta: 25,
      severity:    'medium',
      detail:      `${(ratio * 100).toFixed(1)}% karakter non-printable — kemungkinan binary data tersembunyi dalam teks.`,
    }
  }
  return { rule_name: 'encoding_anomaly', triggered: false, score_delta: 0, severity: 'low', detail: '' }
}
 
// ─────────────────────────────────────────────────────────────────
// MAIN SCANNER
// ─────────────────────────────────────────────────────────────────
 
export function runClientDetection(content: ContentToScan): ClientDetectionResult {
  // Hanya scan konten teks — file tidak bisa dibaca browser sebagai teks
  const isTextContent = ['text', 'note'].includes(content.secret_type)
 
  const rules = isTextContent && content.text
    ? [ruleKeywordDangerous, ruleUrlPhishing, ruleEncodingAnomaly]
    : []
  // Tipe 'password' tidak di-scan — justru itu use case utama platform
 
  const results: ClientRuleResult[] = []
  let totalScore = 0
 
  for (const ruleFn of rules) {
    try {
      const result = ruleFn(content)
      results.push(result)
      if (result.triggered) {
        totalScore = Math.min(totalScore + result.score_delta, 100)
        console.debug(`[client-detection] ${result.rule_name}: +${result.score_delta} → ${totalScore}`)
      }
    } catch (err) {
      console.error('[client-detection] Rule error:', err)
    }
  }
 
  const triggered = results.filter(r => r.triggered).map(r => r.rule_name)
  const action: 'allowed' | 'flagged' | 'blocked' =
    totalScore >= SCORE_FLAG ? 'flagged' : 'allowed'
 
  return {
    risk_score:      totalScore,
    action,
    rules_triggered: triggered,
    rule_details:    results,
    scanned_at:      new Date().toISOString(),
  }
}