import type { FormFieldType } from "../generated/client/index";

export interface FieldSeed {
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  config?: unknown;
  options?: { value: string; label: string }[];
}

export interface SectionSeed {
  title: string;
  fields: FieldSeed[];
}

export interface PageSeed {
  title: string;
  sections: SectionSeed[];
}

export interface RuleSeed {
  targetKey: string;
  action: "SHOW" | "REQUIRE" | "HIDE";
  condition: { sourceFieldKey: string; operator: string; value?: unknown };
}

/**
 * The real 28-question onboarding form (spec section 9.2), authored as data
 * for the form engine's own tables — not hardcoded React. Q5 and Q27 each
 * become 2 FormField rows (a value + an image, and a yes/no gate + a
 * conditional detail field respectively); the two "separately versioned
 * confirmations" become CONSENT fields in the final section.
 */
export const ONBOARDING_PAGES: PageSeed[] = [
  {
    title: "اطلاعات شخصی",
    sections: [
      {
        title: "مشخصات فردی",
        fields: [
          { key: "full_name", label: "نام و نام خانوادگی", type: "TEXT", required: true },
          { key: "contact_mobile", label: "شماره موبایل تماس", type: "PHONE", required: true },
          { key: "messenger_mobile", label: "شماره موبایل متصل به پیام‌رسان", type: "PHONE", required: true },
          { key: "role_in_channel", label: "نقش در کانال یا مجموعه", type: "TEXT", required: true },
        ],
      },
    ],
  },
  {
    title: "اطلاعات کانال",
    sections: [
      {
        title: "مشخصات کانال",
        fields: [
          { key: "channel_name", label: "نام کانال", type: "TEXT", required: true },
          { key: "eitaa_channel_id", label: "شناسه دقیق کانال ایتا", type: "TEXT", required: true },
          { key: "channel_profile_image", label: "تصویر پروفایل کانال", type: "IMAGE", required: true },
          { key: "admin_eitaa_id", label: "شناسه ایتای مدیر کانال", type: "TEXT", required: true },
          {
            key: "key_team_members",
            label: "اعضای کلیدی تیم",
            type: "REPEATABLE_GROUP",
            config: {
              childFields: [
                { key: "name", label: "نام", type: "TEXT" },
                { key: "role", label: "نقش", type: "TEXT" },
              ],
            },
          },
          { key: "member_count", label: "تعداد اعضای کانال", type: "NUMBER", required: true },
          { key: "established_at", label: "تاریخ تاسیس رسانه", type: "JALALI_DATE", required: true },
          {
            key: "view_percentage",
            label: "درصد بازدید پست‌ها نسبت به اعضا",
            type: "SINGLE_SELECT",
            required: true,
            options: [
              { value: "below_5", label: "کمتر از ۵٪" },
              { value: "5_10", label: "۵ تا ۱۰٪" },
              { value: "10_15", label: "۱۰ تا ۱۵٪" },
              { value: "15_20", label: "۱۵ تا ۲۰٪" },
              { value: "20_25", label: "۲۰ تا ۲۵٪" },
              { value: "above_25", label: "بیشتر از ۲۵٪" },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "کیفیت رسانه‌ای",
    sections: [
      {
        title: "ارزیابی مدیریت و محتوا",
        fields: [
          {
            key: "admin_qualified",
            label: "آیا مدیر فعلی برای پیشبرد اهداف کانال صلاحیت دارد؟",
            type: "SINGLE_SELECT",
            required: true,
            options: [
              { value: "yes", label: "بله" },
              { value: "partly", label: "تا حدی" },
              { value: "no", label: "خیر" },
            ],
          },
          { key: "admin_action_plan", label: "چه اقدامی برای تأمین مدیر مناسب انجام خواهد شد؟", type: "LONG_TEXT" },
          {
            key: "specialist_domain",
            label: "حوزه تخصصی",
            type: "SINGLE_SELECT",
            required: true,
            options: [
              { value: "health", label: "سلامت" },
              { value: "education", label: "آموزش و تربیت" },
              { value: "entertainment", label: "سرگرمی" },
              { value: "humor", label: "طنز" },
              { value: "skills", label: "مهارت" },
              { value: "tools", label: "ابزار" },
              { value: "religious", label: "مذهبی" },
              { value: "books_poetry", label: "کتاب و شعر" },
              { value: "science", label: "علمی" },
              { value: "news", label: "خبری" },
              { value: "sports", label: "ورزشی" },
              { value: "other", label: "سایر" },
            ],
          },
          { key: "years_experience", label: "سابقه پژوهشی یا فعالیت کنشگری (سال)", type: "NUMBER", required: true },
          { key: "manager_resume", label: "رزومه مدیر", type: "DOCUMENT" },
          { key: "significant_output", label: "آثار رسانه‌ای شاخص", type: "LONG_TEXT" },
          {
            key: "main_format",
            label: "قالب اصلی کانال",
            type: "SINGLE_SELECT",
            required: true,
            options: [
              { value: "multimedia", label: "تولید چندرسانه‌ای و تصویری" },
              { value: "interactive", label: "تعاملی، وبلاگی یا فردمحور" },
              { value: "emotional", label: "احساسی، انگیزشی یا مذهبی" },
              { value: "news", label: "خبری، اطلاع‌رسانی یا توضیحی" },
              { value: "scientific", label: "علمی، تحلیلی یا پژوهشی" },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "تجربه رشد",
    sections: [
      {
        title: "سابقه و برنامه تبلیغاتی",
        fields: [
          {
            key: "previous_promotion_experience",
            label: "تجربه قبلی تبلیغ ویژه پین‌شده و نتیجه جذب مخاطب",
            type: "LONG_TEXT",
          },
          { key: "target_post_analysis", label: "پست مقصد و تحلیل موفقیت یا شکست آن", type: "LONG_TEXT" },
          { key: "proposed_scenario", label: "سناریو یا ایده پیشنهادی برای حمایت تبلیغاتی", type: "LONG_TEXT", required: true },
          {
            key: "revenue_model",
            label: "مدل درآمدی و تأمین مالی",
            type: "SINGLE_SELECT",
            required: true,
            options: [
              { value: "product_sales", label: "فروش محصول یا خدمات" },
              { value: "public_support", label: "حمایت مردمی" },
              { value: "org_budget", label: "بودجه سازمانی یا نهادی" },
              { value: "in_channel_ads", label: "تبلیغات درون‌کاناله" },
              { value: "personal_expense", label: "هزینه شخصی" },
              { value: "no_income", label: "بدون درآمد" },
              { value: "other", label: "سایر" },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "ظرفیت سازمانی و همکاری",
    sections: [
      {
        title: "ساختار و ظرفیت‌ها",
        fields: [
          { key: "org_structure", label: "ساختار سازمانی و نیروی انسانی", type: "LONG_TEXT", required: true },
          {
            key: "expected_cooperation",
            label: "همکاری مورد انتظار با هاتف و ظرفیت ارائه‌شده",
            type: "LONG_TEXT",
            required: true,
          },
          { key: "city_province", label: "شهر و استان فعالیت", type: "TEXT", required: true },
          {
            key: "physical_field_capacity",
            label: "ظرفیت فیزیکی و میدانی",
            type: "MULTI_SELECT",
            options: [
              { value: "physical_base", label: "پایگاه فیزیکی" },
              { value: "booth_station", label: "غرفه، ایستگاه یا موکب" },
              { value: "field_workforce", label: "نیروی میدانی" },
              { value: "content_equipment", label: "تجهیزات تولید محتوا" },
              { value: "other", label: "سایر" },
            ],
          },
          { key: "social_networking_capacity", label: "ظرفیت شبکه‌سازی اجتماعی و فرهنگی", type: "LONG_TEXT" },
          {
            key: "had_shutdown",
            label: "آیا کانال شما سابقه توقف موقت فعالیت داشته است؟",
            type: "SINGLE_SELECT",
            required: true,
            options: [
              { value: "yes", label: "بله" },
              { value: "no", label: "خیر" },
            ],
          },
          { key: "shutdown_details", label: "دلیل، مدت و اقدام اصلاحی توقف فعالیت", type: "LONG_TEXT" },
          {
            key: "continuity_guarantee",
            label: "تضمین تداوم فعالیت محتوایی پس از دریافت حمایت",
            type: "LONG_TEXT",
            required: true,
          },
        ],
      },
    ],
  },
  {
    title: "بازبینی و اقرارنامه‌ها",
    sections: [
      {
        title: "تأییدیه‌ها",
        fields: [
          {
            key: "accuracy_consent",
            label: "صحت اطلاعات ارائه‌شده را تأیید می‌کنم.",
            type: "CONSENT",
            required: true,
            config: { consentKey: "accuracy-declaration" },
          },
          {
            key: "terms_consent",
            label: "با شرایط استفاده و سیاست حریم خصوصی موافقم.",
            type: "CONSENT",
            required: true,
            config: { consentKey: "terms-and-privacy" },
          },
        ],
      },
    ],
  },
];

export const ONBOARDING_RULES: RuleSeed[] = [
  {
    targetKey: "admin_action_plan",
    action: "REQUIRE",
    condition: { sourceFieldKey: "admin_qualified", operator: "in", value: ["partly", "no"] },
  },
  {
    targetKey: "target_post_analysis",
    action: "SHOW",
    condition: { sourceFieldKey: "previous_promotion_experience", operator: "isNotEmpty" },
  },
  {
    targetKey: "shutdown_details",
    action: "SHOW",
    condition: { sourceFieldKey: "had_shutdown", operator: "equals", value: "yes" },
  },
];
