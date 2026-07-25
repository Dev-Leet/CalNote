import { create } from 'zustand';

export type CalendarView = 'day' | 'week' | 'month';

interface UiState {
  activeCalendarView: CalendarView;
  isSidebarCollapsed: boolean;
  isConflictModalOpen: boolean;
  activeEventDetailId: string | null;
  showContestOverlay: boolean;
  /** Mobile-only off-canvas nav drawer state — distinct from
   *  isSidebarCollapsed (which was never wired to anything and is left
   *  as-is for potential future desktop-collapse use). On mobile, NavRail
   *  renders as a slide-in drawer controlled by this flag instead of the
   *  always-visible rail desktop gets. */
  isMobileNavOpen: boolean;

  setActiveCalendarView: (view: CalendarView) => void;
  toggleSidebar: () => void;
  openConflictModal: () => void;
  closeConflictModal: () => void;
  openEventDetail: (eventId: string) => void;
  closeEventDetail: () => void;
  toggleContestOverlay: () => void;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
}

/**
 * Purely ephemeral, non-persisted UI state (modal visibility, active
 * calendar view, sidebar collapse) — deliberately separate from
 * aiProviderStore, which persists and carries cross-cutting significance.
 */
export const useUiStore = create<UiState>((set) => ({
  activeCalendarView: 'week',
  isSidebarCollapsed: false,
  isConflictModalOpen: false,
  activeEventDetailId: null,
  showContestOverlay: true,
  isMobileNavOpen: false,

  setActiveCalendarView: (view) => set({ activeCalendarView: view }),
  toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
  openConflictModal: () => set({ isConflictModalOpen: true }),
  closeConflictModal: () => set({ isConflictModalOpen: false }),
  openEventDetail: (eventId) => set({ activeEventDetailId: eventId }),
  closeEventDetail: () => set({ activeEventDetailId: null }),
  toggleContestOverlay: () => set((s) => ({ showContestOverlay: !s.showContestOverlay })),
  openMobileNav: () => set({ isMobileNavOpen: true }),
  closeMobileNav: () => set({ isMobileNavOpen: false }),
  toggleMobileNav: () => set((s) => ({ isMobileNavOpen: !s.isMobileNavOpen })),
}));
