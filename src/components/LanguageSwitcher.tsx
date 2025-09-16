import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Globe, Check } from "lucide-react"
import { useI18n, type LanguageCode } from "@/contexts/i18n"

const languages = [
  { 
    code: 'en', 
    name: 'English', 
    nativeName: 'English',
    flag: '🇺🇸'
  },
  { 
    code: 'hi', 
    name: 'Hindi', 
    nativeName: 'हिन्दी',
    flag: '🇮🇳'
  }
]

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n()

  const handleLanguageChange = (languageCode: string) => {
    setLang(languageCode as LanguageCode)
    console.log(`Language switched to: ${languageCode}`)
  }

  const getCurrentLanguage = () => {
    return languages.find(language => language.code === lang) || languages[0]
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 hover-elevate"
          data-testid="button-language-switcher"
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">{getCurrentLanguage().nativeName}</span>
          <span className="text-xs">{getCurrentLanguage().flag}</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center justify-between gap-2 hover-elevate"
            data-testid={`language-option-${language.code}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{language.flag}</span>
              <div>
                <div className="font-medium">{language.nativeName}</div>
                <div className="text-xs text-muted-foreground">{language.name}</div>
              </div>
            </div>
            
            {lang === language.code && (
              <Check className="w-4 h-4 text-mission-orange" />
            )}
          </DropdownMenuItem>
        ))}
        
        <div className="px-2 py-1 border-t mt-1">
          <Badge variant="outline" className="text-xs w-full justify-center">
            <Globe className="w-3 h-3 mr-1" />
{t('multilingualSystem')}
          </Badge>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}