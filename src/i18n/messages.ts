/**
 * Translations.
 *
 * `en` is the source of truth: its keys define `MessageKey`, and `ar` is typed
 * as `Record<MessageKey, string>`. A key added to English and forgotten in
 * Arabic is therefore a compile error, not a string that silently falls back to
 * the wrong language at runtime.
 *
 * Placeholders are written `{name}` and filled in by `t(key, vars)`.
 */

export const LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
};

export const LOCALE_DIRECTION: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ar: 'rtl',
};

const en = {
  /* Shell and navigation */
  'nav.label': 'Main',
  'nav.dashboard': 'Dashboard',
  'nav.applications': 'Applications',
  'nav.settings': 'Settings',
  'nav.current': ' (current page)',
  'shell.skip': 'Skip to main content',
  'shell.storageNote':
    'Data is stored only in this browser. Nothing is uploaded and nothing syncs between devices.',
  'shell.themeSwitch': 'Switch to {mode} theme',

  /* Generic */
  'action.cancel': 'Cancel',
  'action.delete': 'Delete',
  'action.remove': 'Remove',
  'action.edit': 'Edit',
  'action.add': 'Add',
  'action.discard': 'Discard',
  'action.closeDialog': 'Close dialog',
  'action.addApplication': 'Add application',
  'action.saveChanges': 'Save changes',
  'action.confirm': 'Confirm',
  'common.none': '—',
  'common.empty': 'Empty',
  'common.notRecorded': 'Not recorded',
  'common.newTab': ' (opens in a new tab)',
  'common.undone': 'This action cannot be undone.',
  'common.salaryFrom': 'From {value}',
  'common.salaryUpTo': 'Up to {value}',

  /* Domain labels */
  'status.saved': 'Saved',
  'status.applied': 'Applied',
  'status.screening': 'Screening',
  'status.interview': 'Interview',
  'status.offer': 'Offer',
  'status.rejected': 'Rejected',
  'status.withdrawn': 'Withdrawn',
  'arrangement.remote': 'Remote',
  'arrangement.hybrid': 'Hybrid',
  'arrangement.onsite': 'On-site',
  'employment.full_time': 'Full-time',
  'employment.part_time': 'Part-time',
  'employment.internship': 'Internship',
  'employment.contract': 'Contract',
  'interviewType.phone_screen': 'Phone screen',
  'interviewType.technical': 'Technical',
  'interviewType.behavioral': 'Behavioral',
  'interviewType.system_design': 'System design',
  'interviewType.onsite': 'On-site',
  'interviewType.final': 'Final round',
  'interviewType.other': 'Other',

  /* Relative dates */
  'date.today': 'Today',
  'date.tomorrow': 'Tomorrow',
  'date.yesterday': 'Yesterday',
  'date.in': 'In {count} days',
  'date.ago': '{count} days ago',
  'date.localZone': 'your local time',

  /* Dashboard */
  'dashboard.title': 'Dashboard',
  'dashboard.description':
    'A summary of your job search, calculated from the applications saved in this browser.',
  'dashboard.descriptionEmpty':
    'A summary of your job search, calculated from the applications you have saved.',
  'dashboard.total': 'Total applications',
  'dashboard.totalDef': 'Every record saved, whatever its status.',
  'dashboard.active': 'Active',
  'dashboard.activeDef': 'Still in play: Applied, Screening, Interview or Offer.',
  'dashboard.upcoming': 'Upcoming interviews',
  'dashboard.upcomingDef': 'Interviews dated today or later, on applications still in play.',
  'dashboard.offers': 'Offers',
  'dashboard.offersDef': 'Applications currently at the Offer status.',
  'dashboard.emptyTitle': 'No applications yet',
  'dashboard.emptyDescription':
    'Add your first application and this dashboard will fill in: totals, weekly activity, status breakdown, interviews and follow-ups. You can also restore the sample data from Settings.',
  'dashboard.addFirst': 'Add an application',

  /* Charts */
  'chart.activity': 'Application activity',
  'chart.activityDesc':
    'Applications by the week they were submitted, over the last 12 weeks. {total} in total.',
  'chart.activityCaption': 'Applications submitted per week over the last 12 weeks',
  'chart.weekBeginning': 'Week beginning',
  'chart.submittedHeader': 'Applications submitted',
  'chart.weekOf': 'Week of {label}',
  'chart.submitted': 'Submitted',
  'chart.byStatus': 'Applications by status',
  'chart.byStatusDesc': 'Where every tracked role currently sits.',
  'chart.byStatusCaption': 'Applications grouped by status. {total} in total.',
  'chart.statusHeader': 'Status',
  'chart.applicationsHeader': 'Applications',
  'chart.count': 'Count',
  'chart.nApplications': '{count} applications',
  'chart.oneApplication': '1 application',

  /* Upcoming panels */
  'panel.interviews': 'Upcoming interviews',
  'panel.interviewsDesc': 'Scheduled today or later, on applications that are still open.',
  'panel.interviewsEmpty': 'Nothing scheduled',
  'panel.interviewsEmptyDesc':
    "Add an interview from an application's detail page and it will show up here.",
  'panel.followUps': 'Follow-ups',
  'panel.followUpsDesc': 'Open tasks across every application that is still open, soonest first.',
  'panel.followUpsEmpty': 'Nothing outstanding',
  'panel.followUpsEmptyDesc':
    'Follow-up tasks you add to an application appear here until you tick them off.',
  'panel.noDate': 'No date',

  /* Track record */
  'outcomes.title': 'Your track record',
  'outcomes.emptyDesc': 'Counted from applications you have actually sent.',
  'outcomes.emptyTitle': 'Nothing sent yet',
  'outcomes.emptyBody':
    'Once you move an application past Saved, this card starts counting replies, interviews and offers from your own history.',
  'outcomes.description':
    'Counted from the {count} applications you have actually sent. These are your own past results, not a prediction about any particular role.',
  'outcomes.replied': 'Got a reply',
  'outcomes.repliedDef':
    'Reached Screening, Interview, Offer or Rejected. A rejection is still a reply.',
  'outcomes.interviewed': 'Reached an interview',
  'outcomes.interviewedDef':
    'Reached Interview or Offer at any point, even if it ended in a rejection later.',
  'outcomes.offered': 'Reached an offer',
  'outcomes.offeredDef': 'Reached the Offer status at any point.',
  'outcomes.ofTotal': '{count} of {total}',
  'outcomes.noWait': 'No replies yet, so there is no typical wait to report.',
  'outcomes.wait': 'Typical wait for a first reply:',
  'outcomes.days': '{count} days',
  'outcomes.oneDay': '1 day',
  'outcomes.median': '(median)',
  'outcomes.waiting': '{count} still waiting',
  'outcomes.smallSample':
    'Under {threshold} applications, these percentages swing wildly with every new record. The counts are accurate; the rates are not worth reading yet.',

  /* Applications */
  'applications.title': 'Applications',
  'applications.description':
    'Every role you are tracking. Search, filter and sort the list, or switch to the board to see progress by stage.',
  'applications.view': 'View',
  'applications.viewTable': 'Table',
  'applications.viewBoard': 'Board',
  'applications.caption': 'Job applications, with status, dates and actions for each row',
  'applications.colRole': 'Role',
  'applications.colLocation': 'Location',
  'applications.colApplied': 'Applied',
  'applications.colStatus': 'Status',
  'applications.colUpdated': 'Updated',
  'applications.colActions': 'Actions',
  'applications.appliedOn': 'Applied {date}',
  'applications.emptyTitle': 'No applications yet',
  'applications.emptyFiltered': 'No applications match your filters',
  'applications.emptyDesc':
    'Add the first role you are tracking, or restore the sample data from Settings.',
  'applications.emptyFilteredDesc':
    'Try a different search term, or clear the filters to see everything again.',
  'applications.editAria': 'Edit {title} at {company}',
  'applications.deleteAria': 'Delete {title} at {company}',
  'applications.statusAria': 'Status for {title} at {company}',
  'applications.moveAria': 'Move {title} at {company} to another status',
  'applications.deleteTitle': 'Delete this application?',
  'applications.deleteDesc':
    '{title} at {company}, along with its interviews, follow-ups and timeline.',

  /* Filters */
  'filters.searchLabel': 'Search by company or role',
  'filters.searchPlaceholder': 'Search company or role',
  'filters.button': 'Filters',
  'filters.sortBy': 'Sort by',
  'filters.sortAs': 'Sort: {label}',
  'filters.sortAppliedDate': 'Application date',
  'filters.sortCompany': 'Company',
  'filters.sortUpdatedAt': 'Last updated',
  'filters.sortAscAria': 'Sort ascending',
  'filters.sortDescAria': 'Sort descending',
  'filters.asc': 'Ascending',
  'filters.desc': 'Descending',
  'filters.status': 'Status',
  'filters.arrangement': 'Work arrangement',
  'filters.employment': 'Employment type',
  'filters.showing': 'Showing {shown} of {total} applications',
  'filters.clear': 'Clear filters',

  /* Kanban */
  'kanban.emptyTitle': 'Nothing to show on the board',
  'kanban.emptyDesc': 'No applications match the current search and filters.',
  'kanban.cards': '{count} cards',
  'kanban.oneCard': '1 card',

  /* Form */
  'form.createTitle': 'Add application',
  'form.createDesc': 'Track a role you have applied for or want to apply for.',
  'form.editTitle': 'Edit application',
  'form.editDesc': 'Update the details of this application.',
  'form.company': 'Company',
  'form.jobTitle': 'Job title',
  'form.jobUrl': 'Job posting link',
  'form.jobUrlHint': 'Optional. Must start with http:// or https://.',
  'form.location': 'Location',
  'form.arrangement': 'Work arrangement',
  'form.employment': 'Employment type',
  'form.salaryLegend': 'Salary range (optional)',
  'form.salaryMin': 'Minimum',
  'form.salaryMax': 'Maximum',
  'form.currency': 'Currency',
  'form.currencyHint': '3-letter code',
  'form.appliedDate': 'Application date',
  'form.status': 'Status',
  'form.followUp': 'Next follow-up',
  'form.followUpHint': 'Optional reminder date',
  'form.notes': 'Notes',
  'form.notesHint': 'Plain text. Contacts, salary expectations, anything worth remembering.',
  'form.notesPlaceholder': 'Recruiter mentioned a two-stage process…',
  'form.submitSr': 'Save application',

  /* Detail */
  'detail.back': 'All applications',
  'detail.notFound': 'Application not found',
  'detail.notFoundDesc':
    'It may have been deleted, or the link points at a record that is not in this browser.',
  'detail.backButton': 'Back to applications',
  'detail.roleDetails': 'Role details',
  'detail.salary': 'Salary range',
  'detail.posting': 'Job posting',
  'detail.updated': 'Last updated',
  'detail.arrangement': 'Arrangement',

  /* Notes */
  'notes.title': 'Notes',
  'notes.description':
    'Stored and displayed as plain text — formatting and HTML are never interpreted.',
  'notes.label': 'Notes for this application',
  'notes.placeholder': 'Contacts, salary expectations, what to prepare…',
  'notes.saved': 'Notes saved.',
  'notes.counter': '{count} / {max} characters',
  'notes.save': 'Save notes',

  /* Interviews */
  'interviews.title': 'Interviews',
  'interviews.description': "Scheduled in this browser's timezone ({zone}).",
  'interviews.emptyTitle': 'No interviews yet',
  'interviews.emptyDesc':
    'Add a date and time once something is scheduled, and it will appear on the dashboard.',
  'interviews.addTitle': 'Add interview',
  'interviews.addDesc': "Times are stored and shown in this browser's timezone ({zone}).",
  'interviews.date': 'Date',
  'interviews.time': 'Time',
  'interviews.timeHint': 'Local time ({zone})',
  'interviews.type': 'Interview type',
  'interviews.notesHint': 'Optional. Interviewers, format, topics to revise.',
  'interviews.at': '{date} at {time}',
  'interviews.removeAria': 'Remove interview on {date} at {time}',
  'interviews.removeTitle': 'Remove this interview?',

  /* Tasks */
  'tasks.title': 'Follow-up tasks',
  'tasks.summary': '{open} open, {done} completed.',
  'tasks.emptyTitle': 'No follow-ups',
  'tasks.emptyDesc':
    'Add a reminder such as “email the recruiter” or “prepare system design notes”.',
  'tasks.newLabel': 'New follow-up',
  'tasks.newPlaceholder': 'Email the recruiter',
  'tasks.dueDate': 'Due date',
  'tasks.due': 'Due {date} · {relative}',
  'tasks.removeAria': 'Remove follow-up: {title}',

  /* Timeline */
  'timeline.title': 'Activity',
  'timeline.description': 'Everything CareerFlow has recorded for this application.',
  'timeline.created': 'Application added',
  'timeline.statusFromTo': 'Status changed from {from} to {to}',
  'timeline.statusTo': 'Status changed to {to}',
  'timeline.updated': 'Details updated',
  'timeline.detailsEdited': 'Details edited',
  'timeline.notesEdited': 'Notes edited',
  'timeline.interviewAdded': 'Interview scheduled for {detail}',
  'timeline.interviewRemoved': 'Interview removed ({detail})',
  'timeline.taskAdded': 'Follow-up added: {detail}',
  'timeline.taskCompleted': 'Follow-up completed: {detail}',
  'timeline.taskReopened': 'Follow-up reopened: {detail}',
  'timeline.taskRemoved': 'Follow-up removed: {detail}',

  /* Settings */
  'settings.title': 'Settings',
  'settings.description':
    'Appearance, and everything to do with the data CareerFlow keeps in this browser.',
  'settings.theme': 'Theme',
  'settings.themeDesc': 'Remembered in this browser.',
  'settings.themeGroup': 'Colour theme',
  'settings.themeNote':
    '“System” follows your operating system’s light or dark setting and updates when it changes.',
  'settings.light': 'Light',
  'settings.dark': 'Dark',
  'settings.system': 'System',
  'settings.language': 'Language',
  'settings.languageDesc':
    'Remembered in this browser. Arabic switches the whole layout to right-to-left.',
  'settings.languageGroup': 'Interface language',
  'settings.storage': 'Where your data lives',
  'settings.storageDesc': 'CareerFlow has no account, no server and no sync.',
  'settings.storageBody1':
    'Everything you enter is stored in this browser’s local storage under the key {key} (data format version {version}). Nothing is uploaded anywhere.',
  'settings.storageBody2':
    'That means your applications are not shared between devices or browsers, and clearing your browser’s site data — or using private browsing — will remove them. Export a JSON file before switching machines or clearing your browser.',
  'settings.storageCount': 'You are currently tracking {count} applications.',
  'settings.storageCountOne': 'You are currently tracking 1 application.',
  'settings.transfer': 'Export and import',
  'settings.transferDesc':
    'A plain JSON file you can back up, move to another browser, or keep in version control.',
  'settings.export': 'Export JSON',
  'settings.import': 'Import JSON',
  'settings.importAria': 'Choose a CareerFlow JSON file to import',
  'settings.importNote':
    'Importing replaces everything currently stored. You will be asked to confirm first, and an invalid file is rejected without touching your existing data.',
  'settings.importUnreadable': 'That file could not be read.',
  'settings.importUnreadableHint': 'Try exporting again, or choose a different file.',
  'settings.importSuccess': 'Imported {count} applications. Your previous data has been replaced.',
  'settings.importSuccessOne': 'Imported 1 application. Your previous data has been replaced.',
  'settings.importConfirmTitle': 'Replace your data with this file?',
  'settings.importConfirmDesc':
    'The file contains {incoming} applications. Importing replaces the {current} currently stored in this browser.',
  'settings.importConfirm': 'Replace data',
  'settings.reset': 'Reset',
  'settings.resetDesc': 'Both actions are immediate and cannot be undone.',
  'settings.restore': 'Restore the sample data',
  'settings.restoreDesc':
    'Replaces everything with the {count} fictional applications shown on a first visit.',
  'settings.restoreButton': 'Reset to demo data',
  'settings.restoreConfirmTitle': 'Restore the sample data?',
  'settings.restoreConfirmDesc':
    'Your {count} current applications will be replaced by {demo} fictional examples.',
  'settings.restoreConfirm': 'Restore sample data',
  'settings.clear': 'Clear all records',
  'settings.clearDesc':
    'Removes every application and leaves CareerFlow empty. The sample data is not restored afterwards.',
  'settings.clearButton': 'Clear all data',
  'settings.clearConfirmTitle': 'Clear all records?',
  'settings.clearConfirmDesc':
    'All {count} applications, with their interviews, follow-ups and timelines, will be removed from this browser.',
  'settings.clearConfirmDescOne':
    'The single application stored here, with its interviews, follow-ups and timeline, will be removed from this browser.',
  'settings.clearConfirm': 'Clear everything',

  /* Validation. Rendered directly beneath the field's own label, so the
     wording deliberately does not repeat the field name. */
  'validation.required': 'Required',
  'validation.maxLength': 'Must be {max} characters or fewer',
  'validation.date': 'Enter a valid date',
  'validation.time': 'Enter a time as HH:MM',
  'validation.money': 'Enter a number, for example 65000',
  'validation.moneyTooLarge': 'That figure looks too large',
  'validation.url': 'Enter a full link starting with http:// or https://',
  'validation.urlTooLong': 'Link is too long',
  'validation.currency': 'Use a 3-letter currency code, for example SAR',
  'validation.salaryOrder': 'Maximum salary must be greater than or equal to the minimum',
  'validation.currencyNeeded': 'Add a currency code for the salary range',

  /* Storage notice */
  'storage.blocked':
    'This browser is blocking local storage, so changes will be lost when you close the tab. Private browsing or a site-data setting is the usual cause.',
  'storage.dismiss': 'Dismiss notice',
} as const;

export type MessageKey = keyof typeof en;

const ar: Record<MessageKey, string> = {
  /* Shell and navigation */
  'nav.label': 'التنقل الرئيسي',
  'nav.dashboard': 'لوحة التحكم',
  'nav.applications': 'الطلبات',
  'nav.settings': 'الإعدادات',
  'nav.current': ' (الصفحة الحالية)',
  'shell.skip': 'تخطَّ إلى المحتوى',
  'shell.storageNote':
    'البيانات محفوظة في هذا المتصفح فقط. لا يُرفع شيء ولا تتزامن بين الأجهزة.',
  'shell.themeSwitch': 'التبديل إلى المظهر {mode}',

  /* Generic */
  'action.cancel': 'إلغاء',
  'action.delete': 'حذف',
  'action.remove': 'إزالة',
  'action.edit': 'تعديل',
  'action.add': 'إضافة',
  'action.discard': 'تجاهل',
  'action.closeDialog': 'إغلاق النافذة',
  'action.addApplication': 'إضافة طلب',
  'action.saveChanges': 'حفظ التغييرات',
  'action.confirm': 'تأكيد',
  'common.none': '—',
  'common.empty': 'فارغ',
  'common.notRecorded': 'غير مسجّل',
  'common.newTab': ' (يفتح في تبويب جديد)',
  'common.undone': 'لا يمكن التراجع عن هذا الإجراء.',
  'common.salaryFrom': 'من {value}',
  'common.salaryUpTo': 'حتى {value}',

  /* Domain labels */
  'status.saved': 'محفوظ',
  'status.applied': 'تم التقديم',
  'status.screening': 'فرز أولي',
  'status.interview': 'مقابلة',
  'status.offer': 'عرض',
  'status.rejected': 'مرفوض',
  'status.withdrawn': 'منسحب',
  'arrangement.remote': 'عن بُعد',
  'arrangement.hybrid': 'هجين',
  'arrangement.onsite': 'حضوري',
  'employment.full_time': 'دوام كامل',
  'employment.part_time': 'دوام جزئي',
  'employment.internship': 'تدريب',
  'employment.contract': 'عقد',
  'interviewType.phone_screen': 'مقابلة هاتفية',
  'interviewType.technical': 'تقنية',
  'interviewType.behavioral': 'سلوكية',
  'interviewType.system_design': 'تصميم أنظمة',
  'interviewType.onsite': 'حضورية',
  'interviewType.final': 'الجولة النهائية',
  'interviewType.other': 'أخرى',

  /* Relative dates */
  'date.today': 'اليوم',
  'date.tomorrow': 'غدًا',
  'date.yesterday': 'أمس',
  'date.in': 'بعد {count} يوم',
  'date.ago': 'قبل {count} يوم',
  'date.localZone': 'توقيتك المحلي',

  /* Dashboard */
  'dashboard.title': 'لوحة التحكم',
  'dashboard.description': 'ملخص بحثك عن وظيفة، محسوب من الطلبات المحفوظة في هذا المتصفح.',
  'dashboard.descriptionEmpty': 'ملخص بحثك عن وظيفة، محسوب من الطلبات التي حفظتها.',
  'dashboard.total': 'إجمالي الطلبات',
  'dashboard.totalDef': 'كل سجل محفوظ، أيًا كانت حالته.',
  'dashboard.active': 'نشطة',
  'dashboard.activeDef': 'ما زالت قائمة: تم التقديم، فرز أولي، مقابلة، أو عرض.',
  'dashboard.upcoming': 'مقابلات قادمة',
  'dashboard.upcomingDef': 'مقابلات بتاريخ اليوم أو بعده، على طلبات ما زالت قائمة.',
  'dashboard.offers': 'العروض',
  'dashboard.offersDef': 'الطلبات التي وصلت حاليًا إلى حالة «عرض».',
  'dashboard.emptyTitle': 'لا توجد طلبات بعد',
  'dashboard.emptyDescription':
    'أضف أول طلب وستمتلئ هذه اللوحة: الإجماليات، النشاط الأسبوعي، توزيع الحالات، المقابلات والمتابعات. ويمكنك أيضًا استعادة البيانات التجريبية من الإعدادات.',
  'dashboard.addFirst': 'أضف طلبًا',

  /* Charts */
  'chart.activity': 'نشاط التقديم',
  'chart.activityDesc':
    'الطلبات حسب أسبوع التقديم، خلال الـ 12 أسبوعًا الماضية. {total} إجمالًا.',
  'chart.activityCaption': 'الطلبات المقدَّمة أسبوعيًا خلال الـ 12 أسبوعًا الماضية',
  'chart.weekBeginning': 'بداية الأسبوع',
  'chart.submittedHeader': 'الطلبات المقدَّمة',
  'chart.weekOf': 'أسبوع {label}',
  'chart.submitted': 'مقدَّمة',
  'chart.byStatus': 'الطلبات حسب الحالة',
  'chart.byStatusDesc': 'أين يقف كل دور تتابعه حاليًا.',
  'chart.byStatusCaption': 'الطلبات مجمّعة حسب الحالة. {total} إجمالًا.',
  'chart.statusHeader': 'الحالة',
  'chart.applicationsHeader': 'الطلبات',
  'chart.count': 'العدد',
  'chart.nApplications': '{count} طلبات',
  'chart.oneApplication': 'طلب واحد',

  /* Upcoming panels */
  'panel.interviews': 'المقابلات القادمة',
  'panel.interviewsDesc': 'مجدولة اليوم أو بعده، على طلبات ما زالت مفتوحة.',
  'panel.interviewsEmpty': 'لا يوجد شيء مجدول',
  'panel.interviewsEmptyDesc': 'أضف مقابلة من صفحة تفاصيل الطلب وستظهر هنا.',
  'panel.followUps': 'المتابعات',
  'panel.followUpsDesc': 'المهام المفتوحة في كل طلب ما زال مفتوحًا، الأقرب أولًا.',
  'panel.followUpsEmpty': 'لا يوجد شيء معلّق',
  'panel.followUpsEmptyDesc': 'مهام المتابعة التي تضيفها لطلب تظهر هنا حتى تُنجزها.',
  'panel.noDate': 'بدون تاريخ',

  /* Track record */
  'outcomes.title': 'سجلّك الفعلي',
  'outcomes.emptyDesc': 'محسوب من الطلبات التي أرسلتها فعلًا.',
  'outcomes.emptyTitle': 'لم تُرسل أي طلب بعد',
  'outcomes.emptyBody':
    'بمجرد نقل طلب إلى ما بعد «محفوظ»، تبدأ هذه البطاقة بعدّ الردود والمقابلات والعروض من سجلّك أنت.',
  'outcomes.description':
    'محسوب من {count} طلبًا أرسلتها فعلًا. هذه نتائجك السابقة، وليست تنبؤًا بأي دور بعينه.',
  'outcomes.replied': 'وصلك رد',
  'outcomes.repliedDef': 'بلغ الفرز الأولي أو المقابلة أو العرض أو الرفض. الرفض رد أيضًا.',
  'outcomes.interviewed': 'وصلت إلى مقابلة',
  'outcomes.interviewedDef': 'بلغ المقابلة أو العرض في أي وقت، حتى لو انتهى بالرفض لاحقًا.',
  'outcomes.offered': 'وصلت إلى عرض',
  'outcomes.offeredDef': 'بلغ حالة «عرض» في أي وقت.',
  'outcomes.ofTotal': '{count} من {total}',
  'outcomes.noWait': 'لا توجد ردود بعد، فلا يوجد زمن انتظار معتاد نذكره.',
  'outcomes.wait': 'الانتظار المعتاد لأول رد:',
  'outcomes.days': '{count} يوم',
  'outcomes.oneDay': 'يوم واحد',
  'outcomes.median': '(الوسيط)',
  'outcomes.waiting': '{count} ما زالت تنتظر',
  'outcomes.smallSample':
    'تحت {threshold} طلبات، تتقلب هذه النسب بشدة مع كل سجل جديد. الأعداد دقيقة، أما النسب فلا تستحق القراءة بعد.',

  /* Applications */
  'applications.title': 'الطلبات',
  'applications.description':
    'كل دور تتابعه. ابحث وصفِّ ورتّب القائمة، أو انتقل إلى اللوحة لترى التقدّم حسب المرحلة.',
  'applications.view': 'طريقة العرض',
  'applications.viewTable': 'جدول',
  'applications.viewBoard': 'لوحة',
  'applications.caption': 'طلبات التوظيف، مع الحالة والتواريخ والإجراءات لكل صف',
  'applications.colRole': 'الدور',
  'applications.colLocation': 'الموقع',
  'applications.colApplied': 'تاريخ التقديم',
  'applications.colStatus': 'الحالة',
  'applications.colUpdated': 'آخر تحديث',
  'applications.colActions': 'إجراءات',
  'applications.appliedOn': 'قُدِّم في {date}',
  'applications.emptyTitle': 'لا توجد طلبات بعد',
  'applications.emptyFiltered': 'لا توجد طلبات تطابق عوامل التصفية',
  'applications.emptyDesc': 'أضف أول دور تتابعه، أو استعد البيانات التجريبية من الإعدادات.',
  'applications.emptyFilteredDesc':
    'جرّب كلمة بحث أخرى، أو امسح عوامل التصفية لرؤية كل شيء مرة أخرى.',
  'applications.editAria': 'تعديل {title} في {company}',
  'applications.deleteAria': 'حذف {title} في {company}',
  'applications.statusAria': 'حالة {title} في {company}',
  'applications.moveAria': 'نقل {title} في {company} إلى حالة أخرى',
  'applications.deleteTitle': 'حذف هذا الطلب؟',
  'applications.deleteDesc': '{title} في {company}، مع مقابلاته ومتابعاته وسجلّه الزمني.',

  /* Filters */
  'filters.searchLabel': 'ابحث بالشركة أو الدور',
  'filters.searchPlaceholder': 'ابحث بالشركة أو الدور',
  'filters.button': 'تصفية',
  'filters.sortBy': 'الترتيب حسب',
  'filters.sortAs': 'الترتيب: {label}',
  'filters.sortAppliedDate': 'تاريخ التقديم',
  'filters.sortCompany': 'الشركة',
  'filters.sortUpdatedAt': 'آخر تحديث',
  'filters.sortAscAria': 'ترتيب تصاعدي',
  'filters.sortDescAria': 'ترتيب تنازلي',
  'filters.asc': 'تصاعدي',
  'filters.desc': 'تنازلي',
  'filters.status': 'الحالة',
  'filters.arrangement': 'نمط العمل',
  'filters.employment': 'نوع التوظيف',
  'filters.showing': 'عرض {shown} من {total} طلبًا',
  'filters.clear': 'مسح التصفية',

  /* Kanban */
  'kanban.emptyTitle': 'لا شيء لعرضه في اللوحة',
  'kanban.emptyDesc': 'لا توجد طلبات تطابق البحث والتصفية الحالية.',
  'kanban.cards': '{count} بطاقات',
  'kanban.oneCard': 'بطاقة واحدة',

  /* Form */
  'form.createTitle': 'إضافة طلب',
  'form.createDesc': 'تابع دورًا قدّمت عليه أو تنوي التقديم عليه.',
  'form.editTitle': 'تعديل الطلب',
  'form.editDesc': 'حدّث تفاصيل هذا الطلب.',
  'form.company': 'الشركة',
  'form.jobTitle': 'المسمى الوظيفي',
  'form.jobUrl': 'رابط الإعلان',
  'form.jobUrlHint': 'اختياري. يجب أن يبدأ بـ http:// أو https://.',
  'form.location': 'الموقع',
  'form.arrangement': 'نمط العمل',
  'form.employment': 'نوع التوظيف',
  'form.salaryLegend': 'نطاق الراتب (اختياري)',
  'form.salaryMin': 'الحد الأدنى',
  'form.salaryMax': 'الحد الأعلى',
  'form.currency': 'العملة',
  'form.currencyHint': 'رمز من ٣ أحرف',
  'form.appliedDate': 'تاريخ التقديم',
  'form.status': 'الحالة',
  'form.followUp': 'المتابعة القادمة',
  'form.followUpHint': 'تاريخ تذكير اختياري',
  'form.notes': 'ملاحظات',
  'form.notesHint': 'نص عادي. جهات الاتصال، توقعات الراتب، أي شيء يستحق التذكّر.',
  'form.notesPlaceholder': 'ذكر مسؤول التوظيف أن العملية من مرحلتين…',
  'form.submitSr': 'حفظ الطلب',

  /* Detail */
  'detail.back': 'كل الطلبات',
  'detail.notFound': 'الطلب غير موجود',
  'detail.notFoundDesc': 'قد يكون حُذف، أو أن الرابط يشير إلى سجل غير موجود في هذا المتصفح.',
  'detail.backButton': 'العودة إلى الطلبات',
  'detail.roleDetails': 'تفاصيل الدور',
  'detail.salary': 'نطاق الراتب',
  'detail.posting': 'إعلان الوظيفة',
  'detail.updated': 'آخر تحديث',
  'detail.arrangement': 'نمط العمل',

  /* Notes */
  'notes.title': 'ملاحظات',
  'notes.description': 'تُحفظ وتُعرض كنص عادي — لا يُفسَّر أي تنسيق أو HTML.',
  'notes.label': 'ملاحظات هذا الطلب',
  'notes.placeholder': 'جهات الاتصال، توقعات الراتب، ما يجب تحضيره…',
  'notes.saved': 'حُفظت الملاحظات.',
  'notes.counter': '{count} / {max} حرف',
  'notes.save': 'حفظ الملاحظات',

  /* Interviews */
  'interviews.title': 'المقابلات',
  'interviews.description': 'مجدولة بتوقيت هذا المتصفح ({zone}).',
  'interviews.emptyTitle': 'لا توجد مقابلات بعد',
  'interviews.emptyDesc': 'أضف تاريخًا ووقتًا بمجرد جدولة شيء، وسيظهر في لوحة التحكم.',
  'interviews.addTitle': 'إضافة مقابلة',
  'interviews.addDesc': 'تُحفظ الأوقات وتُعرض بتوقيت هذا المتصفح ({zone}).',
  'interviews.date': 'التاريخ',
  'interviews.time': 'الوقت',
  'interviews.timeHint': 'التوقيت المحلي ({zone})',
  'interviews.type': 'نوع المقابلة',
  'interviews.notesHint': 'اختياري. المقابِلون، الصيغة، المواضيع التي تحتاج مراجعة.',
  'interviews.at': '{date} الساعة {time}',
  'interviews.removeAria': 'إزالة المقابلة في {date} الساعة {time}',
  'interviews.removeTitle': 'إزالة هذه المقابلة؟',

  /* Tasks */
  'tasks.title': 'مهام المتابعة',
  'tasks.summary': '{open} مفتوحة، {done} مكتملة.',
  'tasks.emptyTitle': 'لا توجد متابعات',
  'tasks.emptyDesc': 'أضف تذكيرًا مثل «راسل مسؤول التوظيف» أو «حضّر ملاحظات تصميم الأنظمة».',
  'tasks.newLabel': 'متابعة جديدة',
  'tasks.newPlaceholder': 'راسل مسؤول التوظيف',
  'tasks.dueDate': 'تاريخ الاستحقاق',
  'tasks.due': 'تستحق {date} · {relative}',
  'tasks.removeAria': 'إزالة المتابعة: {title}',

  /* Timeline */
  'timeline.title': 'النشاط',
  'timeline.description': 'كل ما سجّله CareerFlow لهذا الطلب.',
  'timeline.created': 'أُضيف الطلب',
  'timeline.statusFromTo': 'تغيّرت الحالة من {from} إلى {to}',
  'timeline.statusTo': 'تغيّرت الحالة إلى {to}',
  'timeline.updated': 'حُدِّثت التفاصيل',
  'timeline.detailsEdited': 'عُدِّلت التفاصيل',
  'timeline.notesEdited': 'عُدِّلت الملاحظات',
  'timeline.interviewAdded': 'جُدولت مقابلة في {detail}',
  'timeline.interviewRemoved': 'أُزيلت مقابلة ({detail})',
  'timeline.taskAdded': 'أُضيفت متابعة: {detail}',
  'timeline.taskCompleted': 'اكتملت متابعة: {detail}',
  'timeline.taskReopened': 'أُعيد فتح متابعة: {detail}',
  'timeline.taskRemoved': 'أُزيلت متابعة: {detail}',

  /* Settings */
  'settings.title': 'الإعدادات',
  'settings.description':
    'المظهر، وكل ما يتعلق بالبيانات التي يحفظها CareerFlow في هذا المتصفح.',
  'settings.theme': 'المظهر',
  'settings.themeDesc': 'يُحفظ في هذا المتصفح.',
  'settings.themeGroup': 'مظهر الألوان',
  'settings.themeNote': '«حسب النظام» يتبع إعداد نظام التشغيل الفاتح أو الداكن ويتغيّر معه.',
  'settings.light': 'فاتح',
  'settings.dark': 'داكن',
  'settings.system': 'حسب النظام',
  'settings.language': 'اللغة',
  'settings.languageDesc':
    'تُحفظ في هذا المتصفح. اختيار العربية يقلب التخطيط كاملًا إلى اليمين.',
  'settings.languageGroup': 'لغة الواجهة',
  'settings.storage': 'أين تُحفظ بياناتك',
  'settings.storageDesc': 'CareerFlow بلا حساب ولا خادم ولا مزامنة.',
  'settings.storageBody1':
    'كل ما تُدخله يُحفظ في التخزين المحلي لهذا المتصفح تحت المفتاح {key} (إصدار صيغة البيانات {version}). لا يُرفع شيء إلى أي مكان.',
  'settings.storageBody2':
    'أي أن طلباتك لا تُشارَك بين الأجهزة أو المتصفحات، ومسح بيانات الموقع — أو التصفح المتخفي — سيزيلها. صدّر ملف JSON قبل تغيير الجهاز أو مسح المتصفح.',
  'settings.storageCount': 'تتابع حاليًا {count} طلبًا.',
  'settings.storageCountOne': 'تتابع حاليًا طلبًا واحدًا.',
  'settings.transfer': 'التصدير والاستيراد',
  'settings.transferDesc':
    'ملف JSON عادي يمكنك حفظه احتياطيًا، أو نقله لمتصفح آخر، أو الاحتفاظ به في نظام إصدارات.',
  'settings.export': 'تصدير JSON',
  'settings.import': 'استيراد JSON',
  'settings.importAria': 'اختر ملف JSON من CareerFlow للاستيراد',
  'settings.importNote':
    'الاستيراد يستبدل كل المحفوظ حاليًا. سيُطلب منك التأكيد أولًا، والملف غير الصالح يُرفض دون المساس ببياناتك.',
  'settings.importUnreadable': 'تعذّرت قراءة هذا الملف.',
  'settings.importUnreadableHint': 'جرّب التصدير مرة أخرى، أو اختر ملفًا آخر.',
  'settings.importSuccess': 'استُورد {count} طلبًا. استُبدلت بياناتك السابقة.',
  'settings.importSuccessOne': 'استُورد طلب واحد. استُبدلت بياناتك السابقة.',
  'settings.importConfirmTitle': 'استبدال بياناتك بهذا الملف؟',
  'settings.importConfirmDesc':
    'الملف يحتوي على {incoming} طلبًا. الاستيراد يستبدل الـ {current} المحفوظة حاليًا في هذا المتصفح.',
  'settings.importConfirm': 'استبدال البيانات',
  'settings.reset': 'إعادة التعيين',
  'settings.resetDesc': 'كلا الإجراءين فوري ولا يمكن التراجع عنه.',
  'settings.restore': 'استعادة البيانات التجريبية',
  'settings.restoreDesc':
    'يستبدل كل شيء بـ {count} طلبًا تجريبيًا من تلك التي تظهر عند أول زيارة.',
  'settings.restoreButton': 'استعادة البيانات التجريبية',
  'settings.restoreConfirmTitle': 'استعادة البيانات التجريبية؟',
  'settings.restoreConfirmDesc': 'سيُستبدل {count} طلبًا لديك حاليًا بـ {demo} طلبًا تجريبيًا.',
  'settings.restoreConfirm': 'استعادة البيانات',
  'settings.clear': 'مسح كل السجلات',
  'settings.clearDesc':
    'يزيل كل الطلبات ويترك CareerFlow فارغًا. البيانات التجريبية لا تُستعاد بعدها.',
  'settings.clearButton': 'مسح كل البيانات',
  'settings.clearConfirmTitle': 'مسح كل السجلات؟',
  'settings.clearConfirmDesc':
    'ستُزال كل الطلبات الـ {count}، مع مقابلاتها ومتابعاتها وسجلاتها الزمنية، من هذا المتصفح.',
  'settings.clearConfirmDescOne':
    'سيُحذف الطلب الوحيد المحفوظ هنا، مع مقابلاته ومهامه وسجله، من هذا المتصفح.',
  'settings.clearConfirm': 'مسح كل شيء',

  /* Validation */
  'validation.required': 'مطلوب',
  'validation.maxLength': 'يجب ألا يتجاوز {max} حرفًا',
  'validation.date': 'أدخل تاريخًا صحيحًا',
  'validation.time': 'أدخل الوقت بصيغة HH:MM',
  'validation.money': 'أدخل رقمًا، مثال: 65000',
  'validation.moneyTooLarge': 'هذا الرقم يبدو كبيرًا جدًا',
  'validation.url': 'أدخل رابطًا كاملًا يبدأ بـ http:// أو https://',
  'validation.urlTooLong': 'الرابط طويل جدًا',
  'validation.currency': 'استخدم رمز عملة من ٣ أحرف، مثال: SAR',
  'validation.salaryOrder': 'الحد الأعلى للراتب يجب أن يكون أكبر من الحد الأدنى أو مساويًا له',
  'validation.currencyNeeded': 'أضف رمز العملة لنطاق الراتب',

  /* Storage notice */
  'storage.blocked':
    'هذا المتصفح يمنع التخزين المحلي، لذا ستُفقد التغييرات عند إغلاق التبويب. السبب المعتاد هو التصفح المتخفي أو إعداد لبيانات المواقع.',
  'storage.dismiss': 'إخفاء التنبيه',
};

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = { en, ar };

/**
 * The same keys at runtime. Validation messages travel through Zod as plain
 * strings, so the layer that renders them needs to be able to ask whether a
 * given string is a key it should translate or text to show as-is.
 */
const MESSAGE_KEYS = new Set<string>(Object.keys(en));

export function isMessageKey(value: string): value is MessageKey {
  return MESSAGE_KEYS.has(value);
}
