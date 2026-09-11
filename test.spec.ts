import { test, expect } from '@playwright/test';

test.describe('Organic Chemistry Questionnaire App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('should load the questionnaire app', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Organic Chemistry Board Exam');
  });

  test('should display the first question', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Which of the following conformations of n-butane');
  });

  test('should have 100 questions total', async ({ page }) => {
    await expect(page.locator('text=/Question 1 of 100/')).toBeVisible();
  });

  test('should be able to answer a question', async ({ page }) => {
    const firstOption = page.locator('[role="radio"]').first();
    await firstOption.click();
    await expect(firstOption).toHaveAttribute('aria-checked', 'true');
  });

  test('should navigate to next question after answering', async ({ page }) => {
    const firstOption = page.locator('[role="radio"]').first();
    await firstOption.click();
    
    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();
    
    await expect(page.locator('text=/Question 2 of 100/')).toBeVisible();
  });

  test('should show progress bar', async ({ page }) => {
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();
    await expect(progressBar).toHaveAttribute('aria-valuenow', '1');
  });

  test('should toggle dark mode', async ({ page }) => {
    const themeButton = page.locator('button[aria-label*="dark"], button[aria-label*="light"]').first();
    await themeButton.click();
    
    await expect(page.locator('html.dark')).toBeVisible();
  });

  test('should complete exam and show results', async ({ page }) => {
    // Answer all questions quickly
    for (let i = 0; i < 100; i++) {
      const firstOption = page.locator('[role="radio"]').first();
      await firstOption.click();
      
      if (i < 99) {
        const nextButton = page.locator('button:has-text("Next")');
        await nextButton.click();
        await page.waitForTimeout(100);
      } else {
        const finishButton = page.locator('button:has-text("Finish Exam")');
        await finishButton.click();
      }
    }
    
    await expect(page.locator('h2:has-text("Exam Complete")')).toBeVisible();
    await expect(page.locator('text=/Correct Answers/')).toBeVisible();
  });

  test('should show correct/incorrect answers in results', async ({ page }) => {
    // Answer first question
    const firstOption = page.locator('[role="radio"]').first();
    await firstOption.click();
    
    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();
    
    // Skip to finish
    for (let i = 1; i < 100; i++) {
      const opt = page.locator('[role="radio"]').first();
      await opt.click();
      
      if (i < 99) {
        const nextBtn = page.locator('button:has-text("Next")');
        await nextBtn.click();
        await page.waitForTimeout(50);
      } else {
        const finishBtn = page.locator('button:has-text("Finish Exam")');
        await finishBtn.click();
      }
    }
    
    await expect(page.locator('text=/Exam Complete/')).toBeVisible();
    await expect(page.locator('text=/Correct/')).toBeVisible();
  });
});