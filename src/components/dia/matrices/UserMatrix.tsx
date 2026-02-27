import React from 'react'
import { DIAMatrix } from '../shared/DIAMatrix'
import { ColumnDef, FilterDef, ActionDef, MatrixStats } from '../shared/types'
import { useUserMatrix, UserMatrixRow } from '../../../hooks/dia/useUserMatrix'
import { UserMatrixDetailPanel } from './UserMatrixDetailPanel'

export function UserMatrix() {
  const { data, loading, error, filters, setFilters, refresh } = useUserMatrix()

  const columns: ColumnDef<UserMatrixRow>[] = [
    { id: 'email', label: 'Email', sortable: true, width: '250px' },
    { id: 'display_name', label: 'Display Name', sortable: true },
    { id: 'role', label: 'Role', sortable: true, type: 'badge' },
    {
      id: 'created_at',
      label: 'Created',
      sortable: true,
      type: 'date'
    },
    {
      id: 'last_sign_in_at',
      label: 'Last Active',
      sortable: true,
      type: 'date'
    },
    { id: 'has_dna', label: 'DNA', type: 'boolean' },
    { id: 'listening_count', label: 'Listens', sortable: true },
    { id: 'engagement_count', label: 'Interactions', sortable: true }
  ]

  const filterDefs: FilterDef[] = [
    {
      id: 'search',
      type: 'text',
      placeholder: 'Search by email or name'
    },
    {
      id: 'role',
      type: 'select',
      label: 'Role',
      options: ['fan', 'artist', 'brand', 'developer', 'admin']
    },
    {
      id: 'has_dna',
      type: 'boolean',
      label: 'Has DNA'
    }
  ]

  const actions: ActionDef<UserMatrixRow>[] = [
    {
      id: 'view_journey',
      label: 'View Journey',
      icon: '📜',
      onClick: (row) => {
        alert(`View journey for ${row.email} - Coming soon!`)
      }
    },
    {
      id: 'export_data',
      label: 'Export Data',
      icon: '⬇️',
      onClick: (row) => {
        alert(`Export data for ${row.email} - Coming soon!`)
      }
    }
  ]

  const stats: MatrixStats[] = [
    {
      label: 'Total Users',
      value: data.length,
      icon: '👥'
    },
    {
      label: 'With DNA',
      value: data.filter(u => u.has_dna).length,
      icon: '🧬'
    },
    {
      label: 'Active Today',
      value: data.filter(u => {
        const lastActive = new Date(u.last_sign_in_at)
        const today = new Date()
        return lastActive.toDateString() === today.toDateString()
      }).length,
      icon: '⚡'
    }
  ]

  const handleExport = () => {
    const csv = [
      ['Email', 'Display Name', 'Role', 'Created', 'Last Active', 'Has DNA', 'Listens', 'Interactions'].join(','),
      ...data.map(row =>
        [
          row.email,
          row.display_name || '',
          row.role,
          row.created_at,
          row.last_sign_in_at,
          row.has_dna,
          row.listening_count,
          row.engagement_count
        ].join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `user-matrix-${new Date().toISOString()}.csv`
    a.click()
  }

  return (
    <DIAMatrix
      title="User Matrix"
      data={data}
      columns={columns}
      filters={filterDefs}
      actions={actions}
      stats={stats}
      loading={loading}
      error={error}
      onRefresh={refresh}
      onExport={handleExport}
      expandableDetail={(row) => <UserMatrixDetailPanel userId={row.id} />}
    />
  )
}
