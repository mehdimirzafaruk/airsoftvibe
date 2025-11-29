import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:8081", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Go to the post creation modal by clicking the post creation button.
        frame = context.pages[-1]
        # Click the post creation button to open the post creation modal.
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/div/div/div/div/div/div/div/div[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input valid text content without media into the textarea.
        frame = context.pages[-1]
        # Input valid text content into the post creation textarea.
        elem = frame.locator('xpath=html/body/div[2]/div/div[2]/div/div/div/div/div[2]/div/textarea').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('This is a test post with text content only.')
        

        # -> Submit the post by clicking the share button.
        frame = context.pages[-1]
        # Click the share button to submit the post.
        elem = frame.locator('xpath=html/body/div[2]/div/div[2]/div/div/div/div/div[3]/div[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        try:
            await expect(frame.locator('text=Post successfully created with text only').first).to_be_visible(timeout=5000)
        except AssertionError:
            raise AssertionError('Test case failed: The post creation with text content only did not appear in the feed as expected.')
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    