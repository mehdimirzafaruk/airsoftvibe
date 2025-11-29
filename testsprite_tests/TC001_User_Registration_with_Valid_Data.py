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
        # -> Click the button to go to the registration page.
        frame = context.pages[-1]
        # Click the button to navigate to the registration page
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/div/div/div/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Fill the registration form with valid email, username, full name, and password.
        frame = context.pages[-1]
        # Enter valid email
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/div/div/div/div/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('mehdimirzafarukparmaksiz@gmail.com')
        

        frame = context.pages[-1]
        # Enter valid username
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/div/div/div/div/div[2]/input[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('mehdimirzafarukparmaksiz')
        

        frame = context.pages[-1]
        # Enter optional full name
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/div/div/div/div/div[2]/input[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Mehdi Mirzafaruk Parmaksiz')
        

        frame = context.pages[-1]
        # Enter valid password with minimum 6 characters
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/div/div/div/div/div[2]/input[4]').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('92Mirza1')
        

        # -> Click the 'Kayıt Ol' button to submit the registration form.
        frame = context.pages[-1]
        # Click the 'Kayıt Ol' button to submit the registration form
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/div/div/div/div/div[2]/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Try to submit the registration form again to confirm behavior or try a different username/email to rule out duplicates.
        frame = context.pages[-1]
        # Change username to a slightly different one to avoid duplicates
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/div/div/div/div/div[2]/input[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('mehdimirzafarukparmaksiz1')
        

        frame = context.pages[-1]
        # Click the 'Kayıt Ol' button to submit the registration form again
        elem = frame.locator('xpath=html/body/div/div/div/div[2]/div/div/div/div/div/div[2]/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        try:
            await expect(frame.locator('text=Registration Successful! Welcome aboard').first).to_be_visible(timeout=30000)
        except AssertionError:
            raise AssertionError('Test case failed: The registration did not complete successfully, and the user was not prompted to verify email or redirected to login as expected.')
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    