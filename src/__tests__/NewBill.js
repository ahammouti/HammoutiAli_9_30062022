/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import { setLocalStorage } from '../../setup-jest'
import mockStore from "../__mocks__/store"
import NewBillUI from "../views/NewBillUI.js"
import router from "../app/Router"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import BillsUI from "../views/BillsUI"
import userEvent from "@testing-library/user-event";
import { ROUTES } from "../constants/routes"
import Store from "../app/Store"

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname })
}

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then NewBill Page should be rendered", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      //to-do write assertion
      expect(screen.getByText('Envoyer une note de frais')).toBeTruthy()
    })
    test("Then if I submit, the form should be submited and create a bill", () => {
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee", }));

      const formNewBill = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);
      formNewBill.addEventListener("submit", handleSubmit);
      // userEvent.click(formNewBill)
      fireEvent.submit(formNewBill);
      expect(handleSubmit).toHaveBeenCalled();
    })
  })

  describe("when I fill the image field with the correct format", () => {
    test("it should validate the field without error messages", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee", }));

      const html = NewBillUI()
      document.body.innerHTML = html

      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const file = screen.getByTestId("file");
      const errorFile = screen.getByTestId("errorFile");

      file.addEventListener("change", handleChangeFile);
      fireEvent.change(file, {
        target: {
          files: [new File(["test.png"], "test.png")]
        }
      });

      // document.getElementsByClassName("js-justificatif")[0].getElementsByTagName("small")[0].style.display = "none"
      expect(handleChangeFile).toHaveBeenCalled();
      expect(errorFile.classList.length).toEqual(0)
      expect(file.files[0].name).toBe("test.png");
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
    })
  })

  // Test d'intégration Post
  describe('When I fill in the input fields correctly and I submit the form', () => {
    test("Then, it should create a new Bill and navigate to Bills Page", async () => {

      afterEach(() => jest.resetAllMocks())
      const create = jest.spyOn(mockStore.bills(), 'create');
      const update = jest.spyOn(mockStore.bills(), "update");

      const mockNewBill = {
        "id": "47qAXb6fIm2zOKkLzMro",
        "vat": "80",
        "fileUrl": "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        "status": "pending",
        "type": "Hôtel et logement",
        "commentary": "séminaire billed",
        "name": "encore",
        "fileName": "preview-facture-free-201801-pdf-1.jpg",
        "date": "2004-04-04",
        "amount": 400,
        "commentAdmin": "ok",
        "email": "a@a",
        "pct": 20
      }

      await create({ fileName: "test.jpg" });

      document.body.innerHTML = NewBillUI();
      const updateBill = await update(mockNewBill);
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });
      const handleSubmit = jest.spyOn(newBill, 'handleSubmit');
      const form = screen.getByTestId('form-new-bill');
      const btnSubmitForm = form.querySelector('#btn-send-bill');

      form.addEventListener('submit', handleSubmit);
      userEvent.click(btnSubmitForm);
      fireEvent.submit(form);
      await waitFor(() => screen.getByText('Mes notes de frais'));

      expect(handleSubmit).toHaveBeenCalled();
      expect(updateBill.id).toBe("47qAXb6fIm2zOKkLzMro");
      expect(screen.getByText('Mes notes de frais')).toBeTruthy();
    })
  })

  describe('When an error occurs on API', () => {
    beforeEach(() => {
      jest.spyOn(mockStore, 'bills')
      Object.defineProperty(
        window,
        'localStorage',
        { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'a@a'
      }))
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.appendChild(root)
      router()
    })
    test('fetches bills from an API and fails with 404 message error', () => {
      mockStore.bills.mockImplementationOnce(() =>
        Promise.reject(new Error('Erreur 500'))
      )
      const html = BillsUI({ error: 'Erreur 500' })
      document.body.innerHTML = html
      const message = screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })

    test('fetches messages from an API and fails with 500 message error', () => {
      mockStore.bills.mockImplementationOnce(() =>
        Promise.reject(new Error('Erreur 500'))
      )
      const html = BillsUI({ error: 'Erreur 500' })
      document.body.innerHTML = html
      const message = screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})
