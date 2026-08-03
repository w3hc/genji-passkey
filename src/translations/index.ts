/**
 * Translation system for the application
 * Contains all text strings organized by language
 */

import { Language } from '@/utils/i18n'

// Define the structure of our translations
type TranslationKeys = {
  common: {
    login: string
    logout: string
    register: string
    pleaseLogin: string
    cancel: string
    srLoadingText: string
  }
  home: {
    title: string
    subtitle: string
    greeting: string
    greetingSubtitle: string
    signMessage: string
  }
  navigation: {
    about: string
    settings: string
  }
  settings: {
    title: string
    loginRequired: string
  }
  header: {
    registerTitle: string
    walletInfoText: string
    usernameLabel: string
    usernamePlaceholder: string
    usernameError: string
    createAccount: string
    optionsAriaLabel: string
    mainNavAriaLabel: string
    usernameRequiredTitle: string
    usernameRequiredDescription: string
    noAccountFoundTitle: string
    noAccountFoundDescription: string
    alreadyRegisteredLink: string
  }
  passwordModal: {
    passwordLabel: string
    passwordPlaceholder: string
    passwordRequiredTitle: string
    passwordRequiredDescription: string
    weakPasswordTitle: string
    weakPasswordDescription: string
    submissionErrorTitle: string
    submissionErrorDefaultDescription: string
    requirementsNotMet: string
    strongPassword: string
    mustInclude: string
    reqMinLength: string
    reqUpperCase: string
    reqLowerCase: string
    reqNumber: string
    reqSpecialChar: string
    satisfied: string
    required: string
    submit: string
  }
}

// Define translations for each supported language
type Translations = {
  [key in Language]: TranslationKeys
}

export const translations: Translations = {
  // English
  en: {
    common: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      pleaseLogin: 'Please login',
      cancel: 'Cancel',
      srLoadingText: 'Loading, please wait...',
    },
    home: {
      title: 'Welcome!',
      subtitle: "It's a pleasure to have you here!",
      greeting: 'Hello Anon!',
      greetingSubtitle: 'Sit back, relax, and build something cool!',
      signMessage: 'Sign a message',
    },
    navigation: {
      about: 'About',
      settings: 'Settings',
    },
    settings: {
      title: 'Settings',
      loginRequired: 'Please login to access your settings',
    },
    header: {
      registerTitle: 'Register New Account',
      walletInfoText:
        'An Ethereum wallet will be created and securely stored on your device, protected by your biometric or PIN thanks to',
      usernameLabel: 'Username',
      usernamePlaceholder: 'Enter your username',
      usernameError:
        'Username must be 3-50 characters long and contain only letters, numbers, underscores, and hyphens. It must start and end with a letter or number.',
      createAccount: 'Create Account',
      optionsAriaLabel: 'Options',
      mainNavAriaLabel: 'Main navigation',
      usernameRequiredTitle: 'Username Required',
      usernameRequiredDescription: 'Please enter a username to register.',
      noAccountFoundTitle: 'No Account Found',
      noAccountFoundDescription: 'No passkey found. Please register to create a new account.',
      alreadyRegisteredLink: 'I already registered on another device',
    },
    passwordModal: {
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      passwordRequiredTitle: 'Password Required.',
      passwordRequiredDescription: 'Please enter your password.',
      weakPasswordTitle: 'Weak Password.',
      weakPasswordDescription: 'Please use a stronger password that meets all requirements.',
      submissionErrorTitle: 'Submission Error.',
      submissionErrorDefaultDescription: 'An unexpected error occurred.',
      requirementsNotMet: 'Password does not meet all requirements',
      strongPassword: 'Strong password!',
      mustInclude: 'Password must include:',
      reqMinLength: 'At least 12 characters',
      reqUpperCase: 'One uppercase letter',
      reqLowerCase: 'One lowercase letter',
      reqNumber: 'One number',
      reqSpecialChar: 'One special character',
      satisfied: ' (satisfied)',
      required: ' (required)',
      submit: 'Submit',
    },
  },

  // Mandarin Chinese
  zh: {
    common: {
      login: '登录',
      logout: '登出',
      register: '注册',
      pleaseLogin: '请登录',
      cancel: '取消',
      srLoadingText: '加载中，请稍候...',
    },
    home: {
      title: '欢迎！',
      subtitle: '很高兴您来到这里！',
      greeting: '你好，匿名用户！',
      greetingSubtitle: '坐下来，放松，创造一些很酷的东西！',
      signMessage: '签署消息',
    },
    navigation: {
      about: '关于',
      settings: '设置',
    },
    settings: {
      title: '设置',
      loginRequired: '请登录以访问您的设置',
    },
    header: {
      registerTitle: '注册新账户',
      walletInfoText:
        '系统将为您创建一个以太坊钱包，并安全地存储在您的设备上，通过生物识别或PIN码保护，这要归功于',
      usernameLabel: '用户名',
      usernamePlaceholder: '请输入您的用户名',
      usernameError:
        '用户名长度必须为3-50个字符，只能包含字母、数字、下划线和连字符，且必须以字母或数字开头和结尾。',
      createAccount: '创建账户',
      optionsAriaLabel: '选项',
      mainNavAriaLabel: '主导航',
      usernameRequiredTitle: '需要用户名',
      usernameRequiredDescription: '请输入用户名以完成注册。',
      noAccountFoundTitle: '未找到账户',
      noAccountFoundDescription: '未找到通行密钥。请注册以创建新账户。',
      alreadyRegisteredLink: '我已在其他设备上注册过',
    },
    passwordModal: {
      passwordLabel: '密码',
      passwordPlaceholder: '请输入您的密码',
      passwordRequiredTitle: '需要密码。',
      passwordRequiredDescription: '请输入您的密码。',
      weakPasswordTitle: '密码强度不足。',
      weakPasswordDescription: '请使用满足所有要求的更强密码。',
      submissionErrorTitle: '提交错误。',
      submissionErrorDefaultDescription: '发生意外错误。',
      requirementsNotMet: '密码不满足所有要求',
      strongPassword: '密码强度足够！',
      mustInclude: '密码必须包含：',
      reqMinLength: '至少12个字符',
      reqUpperCase: '一个大写字母',
      reqLowerCase: '一个小写字母',
      reqNumber: '一个数字',
      reqSpecialChar: '一个特殊字符',
      satisfied: '（已满足）',
      required: '（必需）',
      submit: '提交',
    },
  },

  // Hindi
  hi: {
    common: {
      login: 'लॉगिन',
      logout: 'लॉगआउट',
      register: 'रजिस्टर करें',
      pleaseLogin: 'कृपया लॉगिन करें',
      cancel: 'रद्द करें',
      srLoadingText: 'लोड हो रहा है, कृपया प्रतीक्षा करें...',
    },
    home: {
      title: 'स्वागत है!',
      subtitle: 'आपका यहाँ स्वागत है!',
      greeting: 'नमस्ते मित्र!',
      greetingSubtitle: 'आराम से बैठें और कुछ शानदार बनाएं!',
      signMessage: 'संदेश पर हस्ताक्षर करें',
    },
    navigation: {
      about: 'के बारे में',
      settings: 'सेटिंग्स',
    },
    settings: {
      title: 'सेटिंग्स',
      loginRequired: 'अपनी सेटिंग्स एक्सेस करने के लिए कृपया लॉगिन करें',
    },
    header: {
      registerTitle: 'नया खाता पंजीकृत करें',
      walletInfoText:
        'एक एथेरियम वॉलेट बनाया जाएगा और आपके डिवाइस पर सुरक्षित रूप से संग्रहीत किया जाएगा, जो आपके बायोमेट्रिक या पिन द्वारा सुरक्षित होगा, धन्यवाद',
      usernameLabel: 'उपयोगकर्ता नाम',
      usernamePlaceholder: 'अपना उपयोगकर्ता नाम दर्ज करें',
      usernameError:
        'उपयोगकर्ता नाम 3-50 अक्षरों का होना चाहिए और इसमें केवल अक्षर, संख्याएं, अंडरस्कोर और हाइफ़न हो सकते हैं। इसे एक अक्षर या संख्या से शुरू और समाप्त होना चाहिए।',
      createAccount: 'खाता बनाएं',
      optionsAriaLabel: 'विकल्प',
      mainNavAriaLabel: 'मुख्य नेविगेशन',
      usernameRequiredTitle: 'उपयोगकर्ता नाम आवश्यक है',
      usernameRequiredDescription: 'पंजीकरण के लिए कृपया एक उपयोगकर्ता नाम दर्ज करें।',
      noAccountFoundTitle: 'कोई खाता नहीं मिला',
      noAccountFoundDescription: 'कोई पासकी नहीं मिली। नया खाता बनाने के लिए कृपया रजिस्टर करें।',
      alreadyRegisteredLink: 'मैंने पहले ही किसी अन्य डिवाइस पर पंजीकरण कर लिया है',
    },
    passwordModal: {
      passwordLabel: 'पासवर्ड',
      passwordPlaceholder: 'अपना पासवर्ड दर्ज करें',
      passwordRequiredTitle: 'पासवर्ड आवश्यक है।',
      passwordRequiredDescription: 'कृपया अपना पासवर्ड दर्ज करें।',
      weakPasswordTitle: 'कमज़ोर पासवर्ड।',
      weakPasswordDescription:
        'कृपया एक मजबूत पासवर्ड का उपयोग करें जो सभी आवश्यकताओं को पूरा करता हो।',
      submissionErrorTitle: 'सबमिशन त्रुटि।',
      submissionErrorDefaultDescription: 'एक अप्रत्याशित त्रुटि हुई।',
      requirementsNotMet: 'पासवर्ड सभी आवश्यकताओं को पूरा नहीं करता',
      strongPassword: 'मजबूत पासवर्ड!',
      mustInclude: 'पासवर्ड में शामिल होना चाहिए:',
      reqMinLength: 'कम से कम 12 अक्षर',
      reqUpperCase: 'एक बड़ा अक्षर',
      reqLowerCase: 'एक छोटा अक्षर',
      reqNumber: 'एक संख्या',
      reqSpecialChar: 'एक विशेष वर्ण',
      satisfied: ' (पूर्ण)',
      required: ' (आवश्यक)',
      submit: 'जमा करें',
    },
  },

  // Spanish
  es: {
    common: {
      login: 'Iniciar sesión',
      logout: 'Cerrar sesión',
      register: 'Registrarse',
      pleaseLogin: 'Por favor inicia sesión',
      cancel: 'Cancelar',
      srLoadingText: 'Cargando, por favor espera...',
    },
    home: {
      title: '¡Bienvenido!',
      subtitle: '¡Es un placer tenerte aquí!',
      greeting: '¡Hola Anon!',
      greetingSubtitle: '¡Siéntate, relájate y crea algo genial!',
      signMessage: 'Firmar un mensaje',
    },
    navigation: {
      about: 'Acerca de',
      settings: 'Configuración',
    },
    settings: {
      title: 'Configuración',
      loginRequired: 'Por favor inicia sesión para acceder a tu configuración',
    },
    header: {
      registerTitle: 'Registrar nueva cuenta',
      walletInfoText:
        'Se creará una billetera de Ethereum y se almacenará de forma segura en tu dispositivo, protegida por tu biometría o PIN gracias a',
      usernameLabel: 'Nombre de usuario',
      usernamePlaceholder: 'Introduce tu nombre de usuario',
      usernameError:
        'El nombre de usuario debe tener entre 3 y 50 caracteres y contener solo letras, números, guiones bajos y guiones. Debe comenzar y terminar con una letra o número.',
      createAccount: 'Crear cuenta',
      optionsAriaLabel: 'Opciones',
      mainNavAriaLabel: 'Navegación principal',
      usernameRequiredTitle: 'Nombre de usuario requerido',
      usernameRequiredDescription: 'Por favor introduce un nombre de usuario para registrarte.',
      noAccountFoundTitle: 'Cuenta no encontrada',
      noAccountFoundDescription:
        'No se encontró ninguna clave de acceso. Por favor regístrate para crear una nueva cuenta.',
      alreadyRegisteredLink: 'Ya me registré en otro dispositivo',
    },
    passwordModal: {
      passwordLabel: 'Contraseña',
      passwordPlaceholder: 'Introduce tu contraseña',
      passwordRequiredTitle: 'Contraseña requerida.',
      passwordRequiredDescription: 'Por favor introduce tu contraseña.',
      weakPasswordTitle: 'Contraseña débil.',
      weakPasswordDescription:
        'Por favor usa una contraseña más segura que cumpla con todos los requisitos.',
      submissionErrorTitle: 'Error de envío.',
      submissionErrorDefaultDescription: 'Ocurrió un error inesperado.',
      requirementsNotMet: 'La contraseña no cumple con todos los requisitos',
      strongPassword: '¡Contraseña segura!',
      mustInclude: 'La contraseña debe incluir:',
      reqMinLength: 'Al menos 12 caracteres',
      reqUpperCase: 'Una letra mayúscula',
      reqLowerCase: 'Una letra minúscula',
      reqNumber: 'Un número',
      reqSpecialChar: 'Un carácter especial',
      satisfied: ' (cumplido)',
      required: ' (requerido)',
      submit: 'Enviar',
    },
  },

  // French
  fr: {
    common: {
      login: 'Connexion',
      logout: 'Déconnexion',
      register: "S'inscrire",
      pleaseLogin: 'Veuillez vous connecter',
      cancel: 'Annuler',
      srLoadingText: 'Chargement, veuillez patienter...',
    },
    home: {
      title: 'Bienvenue !',
      subtitle: "C'est un plaisir de vous avoir ici !",
      greeting: 'Bonjour Anon !',
      greetingSubtitle: 'Détendez-vous et créez quelque chose de cool !',
      signMessage: 'Signer un message',
    },
    navigation: {
      about: 'À propos',
      settings: 'Paramètres',
    },
    settings: {
      title: 'Paramètres',
      loginRequired: 'Veuillez vous connecter pour accéder à vos paramètres',
    },
    header: {
      registerTitle: 'Créer un nouveau compte',
      walletInfoText:
        'Un portefeuille Ethereum sera créé et stocké en toute sécurité sur votre appareil, protégé par votre biométrie ou votre code PIN grâce à',
      usernameLabel: "Nom d'utilisateur",
      usernamePlaceholder: "Entrez votre nom d'utilisateur",
      usernameError:
        "Le nom d'utilisateur doit comporter entre 3 et 50 caractères et ne contenir que des lettres, chiffres, tirets bas et tirets. Il doit commencer et se terminer par une lettre ou un chiffre.",
      createAccount: 'Créer un compte',
      optionsAriaLabel: 'Options',
      mainNavAriaLabel: 'Navigation principale',
      usernameRequiredTitle: "Nom d'utilisateur requis",
      usernameRequiredDescription: "Veuillez entrer un nom d'utilisateur pour vous inscrire.",
      noAccountFoundTitle: 'Aucun compte trouvé',
      noAccountFoundDescription:
        "Aucune clé d'accès trouvée. Veuillez vous inscrire pour créer un nouveau compte.",
      alreadyRegisteredLink: 'Je suis déjà inscrit sur un autre appareil',
    },
    passwordModal: {
      passwordLabel: 'Mot de passe',
      passwordPlaceholder: 'Entrez votre mot de passe',
      passwordRequiredTitle: 'Mot de passe requis.',
      passwordRequiredDescription: 'Veuillez entrer votre mot de passe.',
      weakPasswordTitle: 'Mot de passe faible.',
      weakPasswordDescription:
        'Veuillez utiliser un mot de passe plus fort qui répond à toutes les exigences.',
      submissionErrorTitle: 'Erreur de soumission.',
      submissionErrorDefaultDescription: "Une erreur inattendue s'est produite.",
      requirementsNotMet: 'Le mot de passe ne répond pas à toutes les exigences',
      strongPassword: 'Mot de passe robuste !',
      mustInclude: 'Le mot de passe doit inclure :',
      reqMinLength: 'Au moins 12 caractères',
      reqUpperCase: 'Une lettre majuscule',
      reqLowerCase: 'Une lettre minuscule',
      reqNumber: 'Un chiffre',
      reqSpecialChar: 'Un caractère spécial',
      satisfied: ' (satisfait)',
      required: ' (requis)',
      submit: 'Soumettre',
    },
  },

  // Arabic
  ar: {
    common: {
      login: 'تسجيل الدخول',
      logout: 'تسجيل الخروج',
      register: 'التسجيل',
      pleaseLogin: 'الرجاء تسجيل الدخول',
      cancel: 'إلغاء',
      srLoadingText: 'جارٍ التحميل، يرجى الانتظار...',
    },
    home: {
      title: 'مرحباً!',
      subtitle: 'يسعدنا وجودك هنا!',
      greeting: 'مرحبا أيها المجهول!',
      greetingSubtitle: 'استرخ وابنِ شيئاً رائعاً!',
      signMessage: 'توقيع رسالة',
    },
    navigation: {
      about: 'حول',
      settings: 'الإعدادات',
    },
    settings: {
      title: 'الإعدادات',
      loginRequired: 'يرجى تسجيل الدخول للوصول إلى إعداداتك',
    },
    header: {
      registerTitle: 'تسجيل حساب جديد',
      walletInfoText:
        'سيتم إنشاء محفظة إيثريوم وتخزينها بأمان على جهازك، محمية ببصمتك البيومترية أو رمز PIN بفضل',
      usernameLabel: 'اسم المستخدم',
      usernamePlaceholder: 'أدخل اسم المستخدم الخاص بك',
      usernameError:
        'يجب أن يتكون اسم المستخدم من 3 إلى 50 حرفًا وأن يحتوي فقط على أحرف وأرقام وشرطات سفلية وشرطات. يجب أن يبدأ وينتهي بحرف أو رقم.',
      createAccount: 'إنشاء حساب',
      optionsAriaLabel: 'خيارات',
      mainNavAriaLabel: 'التنقل الرئيسي',
      usernameRequiredTitle: 'اسم المستخدم مطلوب',
      usernameRequiredDescription: 'يرجى إدخال اسم مستخدم للتسجيل.',
      noAccountFoundTitle: 'لم يتم العثور على حساب',
      noAccountFoundDescription: 'لم يتم العثور على مفتاح مرور. يرجى التسجيل لإنشاء حساب جديد.',
      alreadyRegisteredLink: 'لقد قمت بالتسجيل بالفعل على جهاز آخر',
    },
    passwordModal: {
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: 'أدخل كلمة المرور الخاصة بك',
      passwordRequiredTitle: 'كلمة المرور مطلوبة.',
      passwordRequiredDescription: 'يرجى إدخال كلمة المرور الخاصة بك.',
      weakPasswordTitle: 'كلمة مرور ضعيفة.',
      weakPasswordDescription: 'يرجى استخدام كلمة مرور أقوى تستوفي جميع المتطلبات.',
      submissionErrorTitle: 'خطأ في الإرسال.',
      submissionErrorDefaultDescription: 'حدث خطأ غير متوقع.',
      requirementsNotMet: 'كلمة المرور لا تستوفي جميع المتطلبات',
      strongPassword: 'كلمة مرور قوية!',
      mustInclude: 'يجب أن تتضمن كلمة المرور:',
      reqMinLength: '12 حرفًا على الأقل',
      reqUpperCase: 'حرف كبير واحد',
      reqLowerCase: 'حرف صغير واحد',
      reqNumber: 'رقم واحد',
      reqSpecialChar: 'رمز خاص واحد',
      satisfied: ' (مستوفى)',
      required: ' (مطلوب)',
      submit: 'إرسال',
    },
  },

  // Bengali
  bn: {
    common: {
      login: 'লগ ইন',
      logout: 'লগ আউট',
      register: 'নিবন্ধন করুন',
      pleaseLogin: 'অনুগ্রহ করে লগইন করুন',
      cancel: 'বাতিল করুন',
      srLoadingText: 'লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...',
    },
    home: {
      title: 'স্বাগতম!',
      subtitle: 'আপনাকে এখানে পেয়ে আনন্দিত!',
      greeting: 'হ্যালো বন্ধু!',
      greetingSubtitle: 'বসুন, আরাম করুন এবং কিছু দুর্দান্ত তৈরি করুন!',
      signMessage: 'একটি বার্তায় স্বাক্ষর করুন',
    },
    navigation: {
      about: 'সম্পর্কে',
      settings: 'সেটিংস',
    },
    settings: {
      title: 'সেটিংস',
      loginRequired: 'আপনার সেটিংস অ্যাক্সেস করতে অনুগ্রহ করে লগইন করুন',
    },
    header: {
      registerTitle: 'নতুন অ্যাকাউন্ট নিবন্ধন করুন',
      walletInfoText:
        'একটি ইথেরিয়াম ওয়ালেট তৈরি করা হবে এবং আপনার ডিভাইসে নিরাপদে সংরক্ষিত হবে, যা আপনার বায়োমেট্রিক বা পিন দ্বারা সুরক্ষিত, ধন্যবাদ',
      usernameLabel: 'ব্যবহারকারীর নাম',
      usernamePlaceholder: 'আপনার ব্যবহারকারীর নাম লিখুন',
      usernameError:
        'ব্যবহারকারীর নাম অবশ্যই ৩-৫০ অক্ষরের হতে হবে এবং শুধুমাত্র অক্ষর, সংখ্যা, আন্ডারস্কোর এবং হাইফেন থাকতে পারবে। এটি অবশ্যই একটি অক্ষর বা সংখ্যা দিয়ে শুরু এবং শেষ হতে হবে।',
      createAccount: 'অ্যাকাউন্ট তৈরি করুন',
      optionsAriaLabel: 'বিকল্প',
      mainNavAriaLabel: 'প্রধান নেভিগেশন',
      usernameRequiredTitle: 'ব্যবহারকারীর নাম প্রয়োজন',
      usernameRequiredDescription: 'নিবন্ধনের জন্য অনুগ্রহ করে একটি ব্যবহারকারীর নাম লিখুন।',
      noAccountFoundTitle: 'কোনো অ্যাকাউন্ট পাওয়া যায়নি',
      noAccountFoundDescription:
        'কোনো পাসকী পাওয়া যায়নি। নতুন অ্যাকাউন্ট তৈরি করতে অনুগ্রহ করে নিবন্ধন করুন।',
      alreadyRegisteredLink: 'আমি ইতিমধ্যে অন্য ডিভাইসে নিবন্ধিত হয়েছি',
    },
    passwordModal: {
      passwordLabel: 'পাসওয়ার্ড',
      passwordPlaceholder: 'আপনার পাসওয়ার্ড লিখুন',
      passwordRequiredTitle: 'পাসওয়ার্ড প্রয়োজন।',
      passwordRequiredDescription: 'অনুগ্রহ করে আপনার পাসওয়ার্ড লিখুন।',
      weakPasswordTitle: 'দুর্বল পাসওয়ার্ড।',
      weakPasswordDescription:
        'অনুগ্রহ করে সমস্ত প্রয়োজনীয়তা পূরণ করে এমন একটি শক্তিশালী পাসওয়ার্ড ব্যবহার করুন।',
      submissionErrorTitle: 'জমা দেওয়ার ত্রুটি।',
      submissionErrorDefaultDescription: 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।',
      requirementsNotMet: 'পাসওয়ার্ড সমস্ত প্রয়োজনীয়তা পূরণ করে না',
      strongPassword: 'শক্তিশালী পাসওয়ার্ড!',
      mustInclude: 'পাসওয়ার্ডে অবশ্যই থাকতে হবে:',
      reqMinLength: 'কমপক্ষে ১২টি অক্ষর',
      reqUpperCase: 'একটি বড় হাতের অক্ষর',
      reqLowerCase: 'একটি ছোট হাতের অক্ষর',
      reqNumber: 'একটি সংখ্যা',
      reqSpecialChar: 'একটি বিশেষ অক্ষর',
      satisfied: ' (পূরণ হয়েছে)',
      required: ' (প্রয়োজন)',
      submit: 'জমা দিন',
    },
  },

  // Russian
  ru: {
    common: {
      login: 'Вход',
      logout: 'Выход',
      register: 'Регистрация',
      pleaseLogin: 'Пожалуйста, войдите',
      cancel: 'Отмена',
      srLoadingText: 'Загрузка, пожалуйста подождите...',
    },
    home: {
      title: 'Добро пожаловать!',
      subtitle: 'Рады видеть вас здесь!',
      greeting: 'Привет, незнакомец!',
      greetingSubtitle: 'Расслабьтесь и создайте что-нибудь крутое!',
      signMessage: 'Подписать сообщение',
    },
    navigation: {
      about: 'О нас',
      settings: 'Настройки',
    },
    settings: {
      title: 'Настройки',
      loginRequired: 'Пожалуйста, войдите, чтобы получить доступ к настройкам',
    },
    header: {
      registerTitle: 'Регистрация нового аккаунта',
      walletInfoText:
        'Будет создан Ethereum-кошелёк, надёжно хранящийся на вашем устройстве и защищённый биометрией или PIN-кодом благодаря',
      usernameLabel: 'Имя пользователя',
      usernamePlaceholder: 'Введите имя пользователя',
      usernameError:
        'Имя пользователя должно содержать от 3 до 50 символов и включать только буквы, цифры, подчёркивания и дефисы. Оно должно начинаться и заканчиваться буквой или цифрой.',
      createAccount: 'Создать аккаунт',
      optionsAriaLabel: 'Опции',
      mainNavAriaLabel: 'Основная навигация',
      usernameRequiredTitle: 'Требуется имя пользователя',
      usernameRequiredDescription: 'Пожалуйста, введите имя пользователя для регистрации.',
      noAccountFoundTitle: 'Аккаунт не найден',
      noAccountFoundDescription:
        'Ключ доступа не найден. Пожалуйста, зарегистрируйтесь, чтобы создать новый аккаунт.',
      alreadyRegisteredLink: 'Я уже зарегистрирован на другом устройстве',
    },
    passwordModal: {
      passwordLabel: 'Пароль',
      passwordPlaceholder: 'Введите пароль',
      passwordRequiredTitle: 'Требуется пароль.',
      passwordRequiredDescription: 'Пожалуйста, введите пароль.',
      weakPasswordTitle: 'Слабый пароль.',
      weakPasswordDescription:
        'Пожалуйста, используйте более надёжный пароль, отвечающий всем требованиям.',
      submissionErrorTitle: 'Ошибка отправки.',
      submissionErrorDefaultDescription: 'Произошла непредвиденная ошибка.',
      requirementsNotMet: 'Пароль не соответствует всем требованиям',
      strongPassword: 'Надёжный пароль!',
      mustInclude: 'Пароль должен содержать:',
      reqMinLength: 'Не менее 12 символов',
      reqUpperCase: 'Одну заглавную букву',
      reqLowerCase: 'Одну строчную букву',
      reqNumber: 'Одну цифру',
      reqSpecialChar: 'Один специальный символ',
      satisfied: ' (выполнено)',
      required: ' (требуется)',
      submit: 'Отправить',
    },
  },

  // Portuguese
  pt: {
    common: {
      login: 'Entrar',
      logout: 'Sair',
      register: 'Registrar',
      pleaseLogin: 'Por favor faça login',
      cancel: 'Cancelar',
      srLoadingText: 'Carregando, por favor aguarde...',
    },
    home: {
      title: 'Bem-vindo!',
      subtitle: 'É um prazer tê-lo aqui!',
      greeting: 'Olá Anon!',
      greetingSubtitle: 'Sente-se, relaxe e construa algo legal!',
      signMessage: 'Assinar uma mensagem',
    },
    navigation: {
      about: 'Sobre',
      settings: 'Configurações',
    },
    settings: {
      title: 'Configurações',
      loginRequired: 'Por favor faça login para acessar suas configurações',
    },
    header: {
      registerTitle: 'Registrar nova conta',
      walletInfoText:
        'Uma carteira Ethereum será criada e armazenada com segurança no seu dispositivo, protegida por sua biometria ou PIN graças ao',
      usernameLabel: 'Nome de usuário',
      usernamePlaceholder: 'Digite seu nome de usuário',
      usernameError:
        'O nome de usuário deve ter entre 3 e 50 caracteres e conter apenas letras, números, sublinhados e hífens. Deve começar e terminar com uma letra ou número.',
      createAccount: 'Criar conta',
      optionsAriaLabel: 'Opções',
      mainNavAriaLabel: 'Navegação principal',
      usernameRequiredTitle: 'Nome de usuário obrigatório',
      usernameRequiredDescription: 'Por favor, digite um nome de usuário para se registrar.',
      noAccountFoundTitle: 'Conta não encontrada',
      noAccountFoundDescription:
        'Nenhuma chave de acesso encontrada. Por favor, registre-se para criar uma nova conta.',
      alreadyRegisteredLink: 'Já me registrei em outro dispositivo',
    },
    passwordModal: {
      passwordLabel: 'Senha',
      passwordPlaceholder: 'Digite sua senha',
      passwordRequiredTitle: 'Senha obrigatória.',
      passwordRequiredDescription: 'Por favor, digite sua senha.',
      weakPasswordTitle: 'Senha fraca.',
      weakPasswordDescription:
        'Por favor, use uma senha mais forte que atenda a todos os requisitos.',
      submissionErrorTitle: 'Erro de envio.',
      submissionErrorDefaultDescription: 'Ocorreu um erro inesperado.',
      requirementsNotMet: 'A senha não atende a todos os requisitos',
      strongPassword: 'Senha forte!',
      mustInclude: 'A senha deve incluir:',
      reqMinLength: 'Pelo menos 12 caracteres',
      reqUpperCase: 'Uma letra maiúscula',
      reqLowerCase: 'Uma letra minúscula',
      reqNumber: 'Um número',
      reqSpecialChar: 'Um caractere especial',
      satisfied: ' (satisfeito)',
      required: ' (obrigatório)',
      submit: 'Enviar',
    },
  },

  // Urdu
  ur: {
    common: {
      login: 'لاگ ان',
      logout: 'لاگ آؤٹ',
      register: 'رجسٹر کریں',
      pleaseLogin: 'براہ کرم لاگ ان کریں',
      cancel: 'منسوخ کریں',
      srLoadingText: 'لوڈ ہو رہا ہے، براہ کرم انتظار کریں...',
    },
    home: {
      title: 'خوش آمدید!',
      subtitle: 'آپ کا یہاں ہونا خوشی کی بات ہے!',
      greeting: 'ہیلو دوست!',
      greetingSubtitle: 'آرام سے بیٹھیں اور کچھ شاندار بنائیں!',
      signMessage: 'پیغام پر دستخط کریں',
    },
    navigation: {
      about: 'کے بارے میں',
      settings: 'ترتیبات',
    },
    settings: {
      title: 'ترتیبات',
      loginRequired: 'اپنی ترتیبات تک رسائی کے لیے براہ کرم لاگ ان کریں',
    },
    header: {
      registerTitle: 'نیا اکاؤنٹ رجسٹر کریں',
      walletInfoText:
        'ایک ایتھیریم والیٹ بنایا جائے گا اور آپ کے ڈیوائس پر محفوظ طریقے سے محفوظ کیا جائے گا، جو آپ کے بائیومیٹرک یا پن کے ذریعے محفوظ ہوگا، شکریہ',
      usernameLabel: 'صارف نام',
      usernamePlaceholder: 'اپنا صارف نام درج کریں',
      usernameError:
        'صارف نام 3-50 حروف کا ہونا چاہیے اور اس میں صرف حروف، اعداد، انڈر سکور اور ہائیفن ہونے چاہئیں۔ اسے حرف یا عدد سے شروع اور ختم ہونا چاہیے۔',
      createAccount: 'اکاؤنٹ بنائیں',
      optionsAriaLabel: 'اختیارات',
      mainNavAriaLabel: 'مرکزی نیویگیشن',
      usernameRequiredTitle: 'صارف نام درکار ہے',
      usernameRequiredDescription: 'رجسٹریشن کے لیے براہ کرم صارف نام درج کریں۔',
      noAccountFoundTitle: 'کوئی اکاؤنٹ نہیں ملا',
      noAccountFoundDescription:
        'کوئی پاس کی نہیں ملی۔ نیا اکاؤنٹ بنانے کے لیے براہ کرم رجسٹر کریں۔',
      alreadyRegisteredLink: 'میں پہلے ہی دوسرے ڈیوائس پر رجسٹر ہو چکا ہوں',
    },
    passwordModal: {
      passwordLabel: 'پاس ورڈ',
      passwordPlaceholder: 'اپنا پاس ورڈ درج کریں',
      passwordRequiredTitle: 'پاس ورڈ درکار ہے۔',
      passwordRequiredDescription: 'براہ کرم اپنا پاس ورڈ درج کریں۔',
      weakPasswordTitle: 'کمزور پاس ورڈ۔',
      weakPasswordDescription:
        'براہ کرم ایک مضبوط پاس ورڈ استعمال کریں جو تمام تقاضے پورے کرتا ہو۔',
      submissionErrorTitle: 'جمع کرانے میں خرابی۔',
      submissionErrorDefaultDescription: 'ایک غیر متوقع خرابی پیش آگئی۔',
      requirementsNotMet: 'پاس ورڈ تمام تقاضے پورے نہیں کرتا',
      strongPassword: 'مضبوط پاس ورڈ!',
      mustInclude: 'پاس ورڈ میں شامل ہونا چاہیے:',
      reqMinLength: 'کم از کم 12 حروف',
      reqUpperCase: 'ایک بڑا حرف',
      reqLowerCase: 'ایک چھوٹا حرف',
      reqNumber: 'ایک عدد',
      reqSpecialChar: 'ایک خاص کریکٹر',
      satisfied: ' (پورا ہوگیا)',
      required: ' (درکار ہے)',
      submit: 'جمع کروائیں',
    },
  },
}

/**
 * Get translations for the current language
 * @param language Current language code
 * @returns Translation object for the specified language
 */
export function getTranslations(language: Language) {
  return translations[language]
}

/**
 * Hook to use translations in components
 * @param language Current language code
 * @returns Translation object for the current language
 */
export function useTranslations(language: Language) {
  return translations[language]
}
