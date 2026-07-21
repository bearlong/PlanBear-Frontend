import Link from 'next/link'
import { useMemo, useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import { AuthContext } from '@/context/AuthContext'
import { CCard, CCardBody } from '@coreui/react'
import styles from '@/styles/homePage.module.scss'
import { sidebarModules } from '@/configs/sidebarConfig'
import useUserPermissions from '@/hooks/useUserPermissions'
import { useFavorites } from '@/hooks/useFavorites'

const findSidebarItemByKey = (itemKey) => {
  for (const module of sidebarModules) {
    const matchedItem = module.items.find((item) => item.key === itemKey)
    if (matchedItem) {
      return { module, item: matchedItem }
    }
  }
  return null
}

export default function Favorites() {
  const { hasModuleAccess } = useUserPermissions()
  const [keyword, setKeyword] = useState('')

  const { user } = useContext(AuthContext)
  const { favoriteItems, loading } = useFavorites(user?.username)
  const router = useRouter()

  const featureItems = useMemo(() => {
    if (!favoriteItems) return []
    return Object.keys(favoriteItems)
      .map((key) => {
        const match = findSidebarItemByKey(key)
        if (!match) return null

        const moduleAllowed =
          match.module.alwaysVisible || hasModuleAccess(match.module.key)
        const itemAllowed =
          !match.item.moduleKey || hasModuleAccess(match.item.moduleKey)

        if (!moduleAllowed || !itemAllowed) return null

        return {
          key: key,
          title: match.item.text,
          href: match.item.href,
          moduleLabel: match.module.label,
        }
      })
      .filter(Boolean)
  }, [favoriteItems, hasModuleAccess])

  const groupedByModule = useMemo(() => {
    return featureItems.reduce((acc, feature) => {
      acc[feature.moduleLabel] = acc[feature.moduleLabel]
        ? [...acc[feature.moduleLabel], feature]
        : [feature]
      return acc
    }, {})
  }, [featureItems])

  const hasResults = featureItems.length > 0

  return (
    <div className={`${styles.moduleFrame} ${styles.featuresFrame}`}>
      <CCard className={`${styles.heroCard} mb-3`}>
        <CCardBody className="d-flex flex-column flex-md-row align-items-md-center justify-content-between">
          <div>
            <p
              className={`text-uppercase small mb-1 h2 fw-bold ${styles.subtleLabel}`}
            >
              Favorites
            </p>
          </div>
        </CCardBody>
      </CCard>

      <div className={styles.featuresScroll}>
        {hasResults ? (
          <div className="d-flex flex-column gap-3">
            {Object.entries(groupedByModule).map(([moduleLabel, items]) => (
              <div key={moduleLabel} className={styles.tableWrap}>
                <div className={styles.sectionHeader}>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold h3 mb-0">{moduleLabel}</span>
                  </div>
                </div>
                <div className={styles.taskCard}>
                  <div className={`${styles.taskList} ${styles.favoritesList}`}>
                    {items.map((feature) => {
                      const Icon = feature.Icon
                      return (
                        <Link
                          href={feature.href}
                          key={feature.key}
                          className={`${styles.taskRow} ${styles.featureRow}`}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div>
                              <div className={`${styles.taskTitle} h6`}>
                                {feature.title}
                              </div>
                            </div>
                          </div>

                          <span className={styles.arrow} aria-hidden="true" />
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`${styles.tableWrap} ${styles.emptyState}`}>
            <div className="text-center text-muted py-4 p">
              No favorite functions to display.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
