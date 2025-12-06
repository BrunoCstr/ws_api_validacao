require('dotenv').config()
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const app = express()

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÕES
// ═══════════════════════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3000
const API_KEY = process.env.API_KEY

// ═══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARES
// ═══════════════════════════════════════════════════════════════════════════════

// CORS - Permite apenas origens específicas (ManyChat)
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}
app.use(cors(corsOptions))

// Parser JSON
app.use(express.json())

// Rate Limiting - Limita requisições por IP
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 100, // máximo 100 requisições por minuto por IP
    message: {
        valid: false,
        error: 'Muitas requisições. Tente novamente em alguns minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
})
app.use(limiter)

// Middleware de autenticação por API Key
const authenticateApiKey = (req, res, next) => {
    // Se não tiver API_KEY configurada, pula autenticação (dev mode)
    if (!API_KEY) {
        console.warn('⚠️  API_KEY não configurada. Rodando sem autenticação.')
        return next()
    }

    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '')

    if (!apiKey) {
        return res.status(401).json({
            valid: false,
            error: 'API Key não fornecida.'
        })
    }

    if (apiKey !== API_KEY) {
        return res.status(403).json({
            valid: false,
            error: 'API Key inválida.'
        })
    }

    next()
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÕES DE VALIDAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Valida e normaliza o usuário
 * Padrão: 7 caracteres alfanuméricos (letras a-z e números 0-9)
 * 
 * Exemplos válidos: 268g05v, 8683bx6, c0a8370, k89d892
 */
function validateUser(user) {
    // Verifica se foi informado
    if (!user || typeof user !== 'string') {
        return {
            valid: false,
            error: 'Nenhum usuário informado.'
        }
    }

    // Normaliza: remove espaços e converte para minúsculo
    const normalizedUser = user.trim().toLowerCase()

    // Verifica se está vazio após trim
    if (normalizedUser.length === 0) {
        return {
            valid: false,
            error: 'Nenhum usuário informado.'
        }
    }

    // Regex: exatamente 7 caracteres alfanuméricos (a-z, 0-9)
    const regex = /^[a-z0-9]{7}$/

    if (!regex.test(normalizedUser)) {
        // Mensagens de erro específicas para melhor UX
        if (normalizedUser.length !== 7) {
            return {
                valid: false,
                error: `Usuário inválido. O usuário deve ter exatamente 7 caracteres. Você digitou ${normalizedUser.length}.`
            }
        }

        if (/[^a-z0-9]/.test(normalizedUser)) {
            return {
                valid: false,
                error: 'Usuário inválido. Use apenas letras e números, sem espaços ou caracteres especiais.'
            }
        }

        return {
            valid: false,
            error: 'Usuário inválido. Digite um usuário com 7 caracteres alfanuméricos.'
        }
    }

    return {
        valid: true,
        value: normalizedUser
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROTAS
// ═══════════════════════════════════════════════════════════════════════════════

// Health Check - Verifica se API está funcionando
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    })
})

// Rota principal de validação de usuário
app.post('/validate-user', authenticateApiKey, (req, res) => {
    const { user } = req.body

    // Log para debug (remova em produção se necessário)
    console.log(`[${new Date().toISOString()}] Validando usuário: "${user}"`)

    const result = validateUser(user)

    // Log do resultado
    console.log(`[${new Date().toISOString()}] Resultado:`, result)

    return res.json(result)
})

// Rota alternativa via GET (para testes simples)
app.get('/validate-user', authenticateApiKey, (req, res) => {
    const { user } = req.query

    console.log(`[${new Date().toISOString()}] [GET] Validando usuário: "${user}"`)

    const result = validateUser(user)

    console.log(`[${new Date().toISOString()}] Resultado:`, result)

    return res.json(result)
})

// 404 - Rota não encontrada
app.use((req, res) => {
    res.status(404).json({
        valid: false,
        error: 'Rota não encontrada.'
    })
})

// Error Handler Global
app.use((err, req, res, next) => {
    console.error('Erro:', err)
    res.status(500).json({
        valid: false,
        error: 'Erro interno do servidor.'
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
// INICIALIZAÇÃO DO SERVIDOR
// ═══════════════════════════════════════════════════════════════════════════════

app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('🚀 API de Validação de Usuário')
    console.log('═══════════════════════════════════════════════════════════════')
    console.log(`📡 Servidor rodando em: http://localhost:${PORT}`)
    console.log(`🔐 Autenticação: ${API_KEY ? 'ATIVADA' : 'DESATIVADA (configure API_KEY no .env)'}`)
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('')
    console.log('📌 Endpoints disponíveis:')
    console.log(`   POST /validate-user  → Valida usuário`)
    console.log(`   GET  /validate-user  → Valida usuário (via query param)`)
    console.log(`   GET  /health         → Health check`)
    console.log('')
    console.log('═══════════════════════════════════════════════════════════════')
})

