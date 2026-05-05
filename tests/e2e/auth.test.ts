import { Builder, By, until, WebDriver } from 'selenium-webdriver';

describe('Auth Flow - Login (Regresión con Selenium)', () => {
    let driver: WebDriver;

    // Configuración inicial (Setup)
    beforeAll(async () => {
        driver = await new Builder().forBrowser('chrome').build();
        // Maximizar ventana para que los elementos sean visibles
        await driver.manage().window().maximize();
    }, 15000);

    // Limpieza final (Teardown)
    afterAll(async () => {
        if (driver) {
            await driver.quit();
        }
    });

    const clickNumber = async (num: string) => {
        const btn = await driver.wait(until.elementLocated(By.xpath(`//button[text()='${num}']`)), 5000);
        await btn.click();
    };

    it('Debe mostrar alerta de usuario no encontrado con ID falso', async () => {
        await driver.get('http://localhost:5173/login');
        
        // Esperamos a que cargue el numpad (buscamos el botón 1)
        await driver.wait(until.elementLocated(By.xpath(`//button[text()='1']`)), 5000);

        // Ingresamos un PIN de usuario falso, ej: 9999
        await clickNumber('9');
        await clickNumber('9');
        await clickNumber('9');
        await clickNumber('9');

        // Buscar toast de error (Sonner lo pone en un ol/li o en la clase .sonner-toast)
        // O buscar por el texto si la alerta vibra
        try {
            await driver.wait(until.elementLocated(By.xpath(`//*[contains(text(), 'no encontrado')]`)), 5000);
            expect(true).toBe(true);
        } catch (e) {
            // Si falla, Jest reportará el error
            throw new Error("No apareció la alerta de usuario no encontrado");
        }
    });
});
