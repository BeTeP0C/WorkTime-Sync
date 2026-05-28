'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'

import { useAuthStore, useEmployeesStore, useTeamsStore } from '@/app-store/context'
import { ChatStore } from '@/app-store/stores/ChatStore'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'
import { Select, SelectOption } from '@/shared/ui/Select'
import { AppHeader } from '@/widgets/AppHeader'
import { AssistantChatPanel } from '@/widgets/AssistantChatPanel'

import s from './AssistantClient.module.scss'

const SUGGESTED_QUESTIONS = [
  'У кого из сотрудников график устарел сильнее всего?',
  'Кто перегружен на этой неделе?',
  'Какие сотрудники требуют подтверждения графика в первую очередь?',
]

export const AssistantClient = observer(function AssistantClient() {
  const auth = useAuthStore()
  const currentUserId = auth.currentUser.value?.id ?? null
  const [store] = useState(() => new ChatStore(currentUserId))
  const employeesStore = useEmployeesStore()
  const teamsStore = useTeamsStore()
  const searchParams = useSearchParams()
  const prefilledHandledRef = useRef(false)

  // Если юзер сменился (logout/login на том же табе) — переключаем скоуп истории.
  useEffect(() => {
    store.setScope(currentUserId)
  }, [currentUserId, store])

  useEffect(() => {
    if (!employeesStore.list.loadingStage.isSuccessful) employeesStore.fetch()
  }, [employeesStore])

  useEffect(() => {
    if (!teamsStore.list.loadingStage.isSuccessful) teamsStore.fetch()
  }, [teamsStore])

  // Если пришли с /dashboard через AiQuickAsk, подставляем вопрос и сразу отправляем.
  useEffect(() => {
    if (prefilledHandledRef.current) return
    const q = searchParams?.get('q')?.trim()
    if (!q) return
    prefilledHandledRef.current = true
    store.input.change(q)
    void store.send()
  }, [searchParams, store])

  const employeeOptions = useMemo<SelectOption<string>[]>(
    () =>
      employeesStore.list.items.map((e) => ({
        value: e.id,
        label: e.fullName,
      })),
    [employeesStore.list.items]
  )

  const teamOptions = useMemo<SelectOption<string>[]>(
    () =>
      teamsStore.list.items.map((t) => ({
        value: t.id,
        label: t.name,
      })),
    [teamsStore.list.items]
  )

  const hasMessages = store.messages.value.length > 0

  return (
    <>
      <AppHeader title="AI-ассистент" />

      <Card padding="lg" className={s.scopeCard}>
        <CardHeader title="Уточнить область вопроса" />
        <div className={s.scopeRow}>
          <label className={s.scopeField}>
            <span className={s.scopeLabel}>Сотрудник</span>
            <Select
              value={store.targetEmployeeId.value ?? ''}
              onValueChange={(v) => store.setTargetEmployee(v || null)}
              options={employeeOptions}
              placeholder="Все сотрудники"
            />
          </label>
          <label className={s.scopeField}>
            <span className={s.scopeLabel}>Команда</span>
            <Select
              value={store.targetTeamId.value ?? ''}
              onValueChange={(v) => store.setTargetTeam(v || null)}
              options={teamOptions}
              placeholder="Все команды"
            />
          </label>
        </div>
      </Card>

      <Card padding="lg" className={s.chatCard}>
        <CardHeader
          title="Диалог"
          action={
            hasMessages ? (
              <Button variant="secondary" size="sm" onClick={() => store.reset()}>
                Очистить
              </Button>
            ) : undefined
          }
        />
        <AssistantChatPanel store={store} variant="full" suggestedQuestions={SUGGESTED_QUESTIONS} />
      </Card>
    </>
  )
})
