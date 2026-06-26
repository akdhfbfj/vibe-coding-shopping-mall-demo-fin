import { FOOTER_LEGAL_LINKS, FOOTER_SECTIONS } from '@/data/homeContent.js'

function HomeFooter() {
  return (
    <footer className="atelier-footer">
      <div className="atelier-footer-grid">
        <div>
          <p className="atelier-footer-brand">ATELIER</p>
          <p className="atelier-footer-desc">
            시대를 초월한 디자인과 지속 가능한 소재로 만든 의류.
            현대적인 라이프스타일을 위한 에센셜 워드로브를 제안합니다.
          </p>
        </div>

        {FOOTER_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="atelier-footer-heading">{section.title}</p>
            <ul className="atelier-footer-links">
              {section.links.map((link) => (
                <li key={link}>
                  <a href="#">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="atelier-footer-bottom">
        <span>© 2025 ATELIER. All rights reserved.</span>
        <div className="atelier-footer-legal">
          {FOOTER_LEGAL_LINKS.map((link) => (
            <a key={link} href="#">{link}</a>
          ))}
        </div>
      </div>
    </footer>
  )
}

export default HomeFooter
