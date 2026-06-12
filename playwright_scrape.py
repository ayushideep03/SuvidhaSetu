from playwright.sync_api import sync_playwright
import time

def scrape():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        print("Navigating to search page...")
        page.goto('https://www.myscheme.gov.in/search')
        try:
            page.wait_for_selector('a[href^="/schemes/"]', timeout=15000)
            links = page.locator('a[href^="/schemes/"]').evaluate_all('nodes => nodes.map(n => n.href)')
            print("Found links:", len(links))
            for link in set(links):
                print(link)
        except Exception as e:
            print("Failed to find scheme links:", e)
            print("Page title:", page.title())
        browser.close()

if __name__ == "__main__":
    scrape()
