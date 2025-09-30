import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'

interface ScoreCategory {
  id: string
  key: string
  label: string
  icon: string
  description?: string
  weight?: number
}

interface ScoreCardTemplate {
  id: string
  name: string
  description: string
  categories: ScoreCategory[]
  platform_type: 'music' | 'food' | 'art' | 'film' | 'sports' | 'general'
  is_default: boolean
  created_by: string
  is_mobile_optimized: boolean
  max_score: number
}

interface ScoreCardTemplateManagerProps {
  eventId?: string
  onTemplateSelect?: (template: ScoreCardTemplate) => void
  initialTemplate?: ScoreCardTemplate
}

const DEFAULT_TEMPLATES: Omit<ScoreCardTemplate, 'id' | 'created_by'>[] = [
  {
    name: 'Music Performance',
    description: 'Professional music competition scoring',
    platform_type: 'music',
    is_default: true,
    is_mobile_optimized: true,
    max_score: 5,
    categories: [
      { id: 'energy', key: 'energy', label: 'Energy & Stage Performance', icon: '⚡', description: 'Stage presence and crowd engagement', weight: 1 },
      { id: 'vocals', key: 'vocals', label: 'Vocal Ability', icon: '🎵', description: 'Technical vocal skills and pitch', weight: 1.2 },
      { id: 'stage_presence', key: 'stage_presence', label: 'Stage Presence', icon: '🎭', description: 'Charisma and audience connection', weight: 1 },
      { id: 'originality', key: 'originality', label: 'Originality & Creativity', icon: '✨', description: 'Unique style and creative expression', weight: 1.1 },
      { id: 'overall', key: 'overall', label: 'Overall Performance', icon: '🏆', description: 'Complete performance evaluation', weight: 1.3 }
    ]
  },
  {
    name: 'Culinary Competition',
    description: 'Food competition and cooking show scoring',
    platform_type: 'food',
    is_default: false,
    is_mobile_optimized: true,
    max_score: 5,
    categories: [
      { id: 'taste', key: 'taste', label: 'Taste & Flavor', icon: '👅', description: 'Overall flavor profile and balance', weight: 1.4 },
      { id: 'presentation', key: 'presentation', label: 'Presentation', icon: '🎨', description: 'Visual appeal and plating', weight: 1 },
      { id: 'technique', key: 'technique', label: 'Cooking Technique', icon: '👨‍🍳', description: 'Technical skill and execution', weight: 1.2 },
      { id: 'creativity', key: 'creativity', label: 'Creativity', icon: '💡', description: 'Innovation and unique approach', weight: 1.1 },
      { id: 'overall', key: 'overall', label: 'Overall Dish', icon: '🍽️', description: 'Complete culinary evaluation', weight: 1.3 }
    ]
  },
  {
    name: 'Art Competition',
    description: 'Visual arts and creative works judging',
    platform_type: 'art',
    is_default: false,
    is_mobile_optimized: true,
    max_score: 5,
    categories: [
      { id: 'composition', key: 'composition', label: 'Composition', icon: '🖼️', description: 'Visual balance and structure', weight: 1.2 },
      { id: 'technique', key: 'technique', label: 'Technique & Skill', icon: '🎨', description: 'Technical execution and mastery', weight: 1.1 },
      { id: 'originality', key: 'originality', label: 'Originality', icon: '✨', description: 'Creative uniqueness and innovation', weight: 1.3 },
      { id: 'emotional_impact', key: 'emotional_impact', label: 'Emotional Impact', icon: '❤️', description: 'Emotional resonance with viewer', weight: 1.2 },
      { id: 'overall', key: 'overall', label: 'Overall Artwork', icon: '🏆', description: 'Complete artistic evaluation', weight: 1.2 }
    ]
  },
  {
    name: 'Mobile-First Simple',
    description: 'Streamlined scoring for mobile devices',
    platform_type: 'general',
    is_default: false,
    is_mobile_optimized: true,
    max_score: 5,
    categories: [
      { id: 'performance', key: 'performance', label: 'Performance', icon: '🎯', description: 'Overall performance quality', weight: 1.5 },
      { id: 'impact', key: 'impact', label: 'Impact', icon: '💥', description: 'Audience impact and engagement', weight: 1.3 },
      { id: 'overall', key: 'overall', label: 'Overall', icon: '⭐', description: 'General impression', weight: 1.2 }
    ]
  }
]

const ScoreCardTemplateManager: React.FC<ScoreCardTemplateManagerProps> = ({
  eventId,
  onTemplateSelect,
  initialTemplate
}) => {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<ScoreCardTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ScoreCardTemplate | null>(initialTemplate || null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newTemplate, setNewTemplate] = useState<Partial<ScoreCardTemplate>>({
    name: '',
    description: '',
    platform_type: 'general',
    is_mobile_optimized: true,
    max_score: 5,
    categories: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [user])

  const loadTemplates = async () => {
    try {
      // Load user's custom templates
      let userTemplates: ScoreCardTemplate[] = []
      if (user) {
        const { data, error } = await supabase
          .from('score_card_templates')
          .select('*')
          .eq('created_by', user.id)

        if (error) {
          console.error('Error loading templates:', error)
        } else {
          userTemplates = data || []
        }
      }

      // Combine with default templates
      const defaultTemplatesWithIds: ScoreCardTemplate[] = DEFAULT_TEMPLATES.map((template, index) => ({
        ...template,
        id: `default-${index}`,
        created_by: 'system'
      }))

      setTemplates([...defaultTemplatesWithIds, ...userTemplates])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveCustomTemplate = async () => {
    if (!user || !newTemplate.name || !newTemplate.categories?.length) return

    try {
      const { data, error } = await supabase
        .from('score_card_templates')
        .insert({
          name: newTemplate.name,
          description: newTemplate.description,
          platform_type: newTemplate.platform_type,
          is_mobile_optimized: newTemplate.is_mobile_optimized,
          max_score: newTemplate.max_score,
          categories: newTemplate.categories,
          created_by: user.id,
          is_default: false
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving template:', error)
        return
      }

      setTemplates(prev => [...prev, data])
      setIsCreatingNew(false)
      setNewTemplate({
        name: '',
        description: '',
        platform_type: 'general',
        is_mobile_optimized: true,
        max_score: 5,
        categories: []
      })
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  const addCategory = () => {
    const newCategory: ScoreCategory = {
      id: `cat-${Date.now()}`,
      key: `category_${newTemplate.categories?.length || 0 + 1}`,
      label: 'New Category',
      icon: '⭐',
      description: '',
      weight: 1
    }

    setNewTemplate(prev => ({
      ...prev,
      categories: [...(prev.categories || []), newCategory]
    }))
  }

  const updateCategory = (categoryId: string, updates: Partial<ScoreCategory>) => {
    setNewTemplate(prev => ({
      ...prev,
      categories: prev.categories?.map(cat =>
        cat.id === categoryId ? { ...cat, ...updates } : cat
      ) || []
    }))
  }

  const removeCategory = (categoryId: string) => {
    setNewTemplate(prev => ({
      ...prev,
      categories: prev.categories?.filter(cat => cat.id !== categoryId) || []
    }))
  }

  const selectTemplate = (template: ScoreCardTemplate) => {
    setSelectedTemplate(template)
    onTemplateSelect?.(template)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-yellow"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Score Card Templates</h2>
          <p className="text-gray-400 text-sm">Customize your competition scoring system</p>
        </div>
        <button
          onClick={() => setIsCreatingNew(true)}
          className="bg-accent-yellow text-black px-4 py-2 rounded-lg font-medium hover:bg-accent-yellow/90 transition-colors self-start sm:self-auto"
        >
          Create Custom Template
        </button>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <motion.div
            key={template.id}
            className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
              selectedTemplate?.id === template.id
                ? 'border-accent-yellow bg-accent-yellow/10'
                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            }`}
            onClick={() => selectTemplate(template)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  {template.name}
                  {template.is_mobile_optimized && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">📱 Mobile</span>
                  )}
                </h3>
                <p className="text-gray-400 text-sm mt-1">{template.description}</p>
              </div>
              <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded capitalize">
                {template.platform_type}
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-gray-400">Categories ({template.categories.length}):</div>
              <div className="flex flex-wrap gap-1">
                {template.categories.slice(0, 4).map(category => (
                  <span
                    key={category.id}
                    className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded flex items-center gap-1"
                  >
                    {category.icon} {category.label}
                  </span>
                ))}
                {template.categories.length > 4 && (
                  <span className="text-xs text-gray-400">+{template.categories.length - 4} more</span>
                )}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
              <span>Max Score: {template.max_score}/5</span>
              {template.created_by === 'system' ? (
                <span className="text-blue-400">Default</span>
              ) : (
                <span className="text-green-400">Custom</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Custom Template Creator Modal */}
      <AnimatePresence>
        {isCreatingNew && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setIsCreatingNew(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Create Custom Score Card Template</h3>

              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Template Name</label>
                    <input
                      type="text"
                      value={newTemplate.name || ''}
                      onChange={e => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-yellow"
                      placeholder="e.g., My Custom Competition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Platform Type</label>
                    <select
                      value={newTemplate.platform_type || 'general'}
                      onChange={e => setNewTemplate(prev => ({
                        ...prev,
                        platform_type: e.target.value as ScoreCardTemplate['platform_type']
                      }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-yellow"
                    >
                      <option value="general">General</option>
                      <option value="music">Music</option>
                      <option value="food">Food & Culinary</option>
                      <option value="art">Visual Arts</option>
                      <option value="film">Film & Video</option>
                      <option value="sports">Sports</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea
                    value={newTemplate.description || ''}
                    onChange={e => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-yellow"
                    placeholder="Describe your scoring system..."
                    rows={2}
                  />
                </div>

                {/* Options */}
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={newTemplate.is_mobile_optimized}
                      onChange={e => setNewTemplate(prev => ({ ...prev, is_mobile_optimized: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-800 text-accent-yellow focus:ring-accent-yellow"
                    />
                    <span>📱 Mobile Optimized</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-300">Max Score:</span>
                    <select
                      value={newTemplate.max_score || 5}
                      onChange={e => setNewTemplate(prev => ({ ...prev, max_score: parseInt(e.target.value) }))}
                      className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-yellow"
                    >
                      <option value={3}>3</option>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                    </select>
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-300">Scoring Categories</label>
                    <button
                      onClick={addCategory}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Add Category
                    </button>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {newTemplate.categories?.map((category, index) => (
                      <div key={category.id} className="bg-gray-800 p-3 rounded-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Icon</label>
                            <input
                              type="text"
                              value={category.icon}
                              onChange={e => updateCategory(category.id, { icon: e.target.value })}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-accent-yellow"
                              placeholder="🎵"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Label</label>
                            <input
                              type="text"
                              value={category.label}
                              onChange={e => updateCategory(category.id, { label: e.target.value })}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-accent-yellow"
                              placeholder="Category Name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Weight</label>
                            <input
                              type="number"
                              min="0.5"
                              max="2"
                              step="0.1"
                              value={category.weight || 1}
                              onChange={e => updateCategory(category.id, { weight: parseFloat(e.target.value) })}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-accent-yellow"
                            />
                          </div>
                          <div className="sm:col-span-2 lg:col-span-2">
                            <label className="block text-xs text-gray-400 mb-1">Description</label>
                            <input
                              type="text"
                              value={category.description || ''}
                              onChange={e => updateCategory(category.id, { description: e.target.value })}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-accent-yellow"
                              placeholder="Brief description..."
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              onClick={() => removeCategory(category.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {newTemplate.categories?.length === 0 && (
                    <div className="text-center text-gray-500 py-4 border-2 border-dashed border-gray-700 rounded-lg">
                      No categories added yet. Click "Add Category" to start building your template.
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setIsCreatingNew(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveCustomTemplate}
                    disabled={!newTemplate.name || !newTemplate.categories?.length}
                    className="flex-1 bg-accent-yellow text-black py-2 rounded-lg font-medium hover:bg-accent-yellow/90 transition-colors disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    Save Template
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Template Preview */}
      {selectedTemplate && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Selected Template: {selectedTemplate.name}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedTemplate.categories.map(category => (
              <div key={category.id} className="bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium text-white text-sm">{category.label}</span>
                </div>
                {category.description && (
                  <p className="text-xs text-gray-400">{category.description}</p>
                )}
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                  <span>Weight: {category.weight}x</span>
                  <span>Max: {selectedTemplate.max_score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ScoreCardTemplateManager